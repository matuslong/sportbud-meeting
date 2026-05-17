var QuizSlidesService = (function () {
  function createPresentation(parsedQuiz, spreadsheet) {
    validateTemplateConfig();

    var timestamp = Utilities.formatDate(
      parsedQuiz.generatedAt,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm'
    );
    var templateFile = DriveApp.getFileById(QUIZ_CONFIG.TEMPLATE_PRESENTATION_ID);
    var presentationFile = templateFile.makeCopy(
      QUIZ_CONFIG.PROJECT_NAME + ' - ' + parsedQuiz.sourceSheetName + ' - ' + timestamp
    );
    var presentation = SlidesApp.openById(presentationFile.getId());
    var templateBlocks = findRoundTemplateBlocks(presentation);
    var roundBlocks;

    validateRoundTemplateCount(parsedQuiz.rounds, templateBlocks);
    roundBlocks = buildRoundBlocks(parsedQuiz.rounds, templateBlocks);

    fillTemplateSlides(presentation, roundBlocks, templateBlocks);
    movePresentationToSpreadsheetFolder(presentation, spreadsheet);

    return {
      presentation: presentation,
      stats: summarizeRoundBlocks(roundBlocks)
    };
  }

  function validateTemplateConfig() {
    if (!QUIZ_CONFIG.TEMPLATE_PRESENTATION_ID ||
        QUIZ_CONFIG.TEMPLATE_PRESENTATION_ID === 'PASTE_TEMPLATE_PRESENTATION_ID_HERE') {
      throw new Error('Missing QUIZ_CONFIG.TEMPLATE_PRESENTATION_ID.');
    }
  }

  function validateRoundTemplateCount(rounds, templateBlocks) {
    if (rounds.length !== templateBlocks.length) {
      throw new Error(
        'Template contains ' + templateBlocks.length +
        ' round block(s), but sheet contains ' + rounds.length + ' round(s).'
      );
    }
  }

  function buildRoundBlocks(rounds, templateBlocks) {
    return rounds.map(function (round, index) {
      var slides = [];
      var templateBlock = templateBlocks[index];

      round.topics.forEach(function (topic) {
        slides.push({
          type: 'topic',
          replacements: createTopicReplacements(round, topic)
        });
        topic.questions.forEach(function (question) {
          slides.push({
            type: 'question',
            replacements: createQuestionReplacements(
              round,
              {
                type: question.type,
                topicTitle: topic.title,
                question: question.question,
                answer: question.answer,
                order: question.order
              },
              getQuestionNumber(round, question)
            )
          });
        });
      });

      slides.push({
        type: 'question',
        replacements: createQuestionReplacements(
          round,
          round.bonusQuestion,
          getQuestionNumber(round, round.bonusQuestion)
        )
      });

      templateBlock.staticSlots.forEach(function () {
        slides.push({
          type: 'static'
        });
      });

      round.questions.forEach(function (item) {
        slides.push({
          type: 'answer',
          replacements: createAnswerReplacements(
            round,
            item,
            getQuestionNumber(round, item)
          )
        });
      });

      slides.push({
        type: 'answer',
        replacements: createAnswerReplacements(
          round,
          round.bonusQuestion,
          getQuestionNumber(round, round.bonusQuestion)
        )
      });

      validateRoundBlockSize(slides, round.number, templateBlock);

      return {
        roundNumber: round.number,
        slides: slides
      };
    });
  }

  function validateRoundBlockSize(slides, roundNumber, templateBlock) {
    var expectedSlides = templateBlock.slots.length;

    if (slides.length !== expectedSlides) {
      throw new Error(
        'Round ' + roundNumber + ' produced ' + slides.length +
        ' slides, expected ' + expectedSlides + '.'
      );
    }
  }

  function getQuestionNumber(round, item) {
    if (item.type === 'bonus') {
      return round.questions.length + 1;
    }

    return item.order;
  }

  function createTopicReplacements(round, topic) {
    return createBaseReplacements(round, {
      topicTitle: topic.title,
      questionNumber: '',
      questionLabel: 'Tematicky blok',
      questionText: '',
      answerLabel: '',
      answerText: ''
    });
  }

  function createQuestionReplacements(round, item, indexInRound) {
    return createBaseReplacements(round, {
      topicTitle: item.topicTitle,
      questionNumber: String(indexInRound),
      questionLabel: item.type === 'bonus' ? 'Bonus otazka' : 'Otazka ' + indexInRound,
      questionText: item.question,
      answerLabel: '',
      answerText: ''
    });
  }

  function createAnswerReplacements(round, item, indexInRound) {
    return createBaseReplacements(round, {
      topicTitle: item.topicTitle,
      questionNumber: String(indexInRound),
      questionLabel: item.type === 'bonus' ? 'Bonus otazka' : 'Otazka ' + indexInRound,
      questionText: item.question,
      answerLabel: item.type === 'bonus' ? 'Bonus - odpoved' : 'Odpoved ' + indexInRound,
      answerText: item.answer
    });
  }

  function createBaseReplacements(round, values) {
    return [
      { token: QUIZ_CONFIG.TEMPLATE_TOKENS.ROUND_TITLE, value: round.title },
      { token: QUIZ_CONFIG.TEMPLATE_TOKENS.TOPIC_TITLE, value: values.topicTitle || '' },
      { token: QUIZ_CONFIG.TEMPLATE_TOKENS.QUESTION_NUMBER, value: values.questionNumber || '' },
      { token: QUIZ_CONFIG.TEMPLATE_TOKENS.QUESTION_LABEL, value: values.questionLabel || '' },
      { token: QUIZ_CONFIG.TEMPLATE_TOKENS.QUESTION_TEXT, value: values.questionText || '' },
      { token: QUIZ_CONFIG.TEMPLATE_TOKENS.ANSWER_LABEL, value: values.answerLabel || '' },
      { token: QUIZ_CONFIG.TEMPLATE_TOKENS.ANSWER_TEXT, value: values.answerText || '' }
    ];
  }

  function fillTemplateSlides(presentation, roundBlocks, templateBlocks) {
    var insertionIndex = templateBlocks[0].startIndex;
    var insertedSlides = [];

    if (!roundBlocks.length) {
      throw new Error('No renderable quiz items were produced from the sheet.');
    }

    roundBlocks.forEach(function (roundBlock, roundIndex) {
      var templateBlock = templateBlocks[roundIndex];

      roundBlock.slides.forEach(function (renderItem, slotIndex) {
        var templateSlide = templateBlock.slots[slotIndex];
        var duplicatedSlide = templateSlide.slide.duplicate();

        duplicatedSlide.move(insertionIndex + insertedSlides.length);

        if (renderItem.type !== 'static') {
          replaceTokensOnSlide(
            duplicatedSlide,
            renderItem.replacements,
            renderItem.type,
            getSlidePosition(presentation, duplicatedSlide)
          );
          clearMarker(duplicatedSlide, markerForType(renderItem.type));
        }

        insertedSlides.push(duplicatedSlide);
      });
    });

    removeRoundTemplateBlocks(templateBlocks);
  }

  function findRoundTemplateBlocks(presentation) {
    var slides = presentation.getSlides();
    var blocks = [];
    var i;

    for (i = 0; i < slides.length; i += 1) {
      var slideType = detectSlideType(presentation, slides[i], i + 1);
      var block;

      if (!slideType) {
        continue;
      }

      if (slideType !== 'topic') {
        throw new Error(
          'Template slide ' + (i + 1) +
          ' contains a "' + slideType + '" marker outside a round block.'
        );
      }

      block = parseRoundTemplateBlock(presentation, slides, i, blocks.length + 1);
      blocks.push(block);
      i = block.endIndex;
    }

    if (!blocks.length) {
      throw new Error(
        'Template is missing the first topic marker slide (' + markerForType('topic') + ').'
      );
    }

    return blocks;
  }

  function parseRoundTemplateBlock(presentation, slides, startIndex, blockNumber) {
    var questionSlots = buildQuestionTemplateSlotSequence();
    var answerSlots = buildAnswerTemplateSlotSequence();
    var slots = [];
    var staticSlots = [];
    var cursor = startIndex;
    var i;

    for (i = 0; i < questionSlots.length; i += 1) {
      var expectedType = questionSlots[i].type;
      var questionSlide = slides[cursor];
      var questionSlideType;

      if (!questionSlide) {
        throw new Error(
          'Template round block ' + blockNumber +
          ' is incomplete. Missing slide for slot ' + (i + 1) + '.'
        );
      }

      questionSlideType = detectSlideType(presentation, questionSlide, cursor + 1);

      if (questionSlideType !== expectedType) {
        throw new Error(
          'Template round block ' + blockNumber +
          ' slot ' + (i + 1) + ' expected "' + expectedType +
          '" marker, found "' + (questionSlideType || 'none') + '".'
        );
      }

      slots.push({
        type: expectedType,
        slide: questionSlide
      });
      cursor += 1;
    }

    while (cursor < slides.length) {
      var staticSlide = slides[cursor];
      var staticSlideType = detectSlideType(presentation, staticSlide, cursor + 1);

      if (staticSlideType === 'answer') {
        break;
      }

      if (staticSlideType) {
        throw new Error(
          'Template round block ' + blockNumber +
          ' contains unexpected "' + staticSlideType +
          '" marker in the static promo section on slide ' + (cursor + 1) + '.'
        );
      }

      staticSlots.push({
        type: 'static',
        slide: staticSlide
      });
      slots.push({
        type: 'static',
        slide: staticSlide
      });
      cursor += 1;
    }

    if (cursor >= slides.length) {
      throw new Error(
        'Template round block ' + blockNumber +
        ' is missing the first answer marker slide (' + markerForType('answer') + ').'
      );
    }

    for (i = 0; i < answerSlots.length; i += 1) {
      var answerSlide = slides[cursor];
      var answerType;

      if (!answerSlide) {
        throw new Error(
          'Template round block ' + blockNumber +
          ' is incomplete. Missing answer slide for slot ' + (i + 1) + '.'
        );
      }

      answerType = detectSlideType(presentation, answerSlide, cursor + 1);

      if (answerType !== 'answer') {
        throw new Error(
          'Template round block ' + blockNumber +
          ' answer slot ' + (i + 1) + ' expected "answer" marker, found "' +
          (answerType || 'none') + '".'
        );
      }

      slots.push({
        type: 'answer',
        slide: answerSlide
      });
      cursor += 1;
    }

    return {
      startIndex: startIndex,
      endIndex: cursor - 1,
      staticSlots: staticSlots,
      slots: slots
    };
  }

  function buildQuestionTemplateSlotSequence() {
    var slots = [];
    var topicCount = QUIZ_CONFIG.RULES.TOPICS_PER_ROUND;
    var questionsPerTopic = QUIZ_CONFIG.RULES.QUESTIONS_PER_TOPIC;
    var bonusCount = QUIZ_CONFIG.RULES.BONUS_PER_ROUND;
    var topicIndex;
    var questionIndex;
    var bonusIndex;

    for (topicIndex = 0; topicIndex < topicCount; topicIndex += 1) {
      slots.push({ type: 'topic' });

      for (questionIndex = 0; questionIndex < questionsPerTopic; questionIndex += 1) {
        slots.push({ type: 'question' });
      }
    }

    for (bonusIndex = 0; bonusIndex < bonusCount; bonusIndex += 1) {
      slots.push({ type: 'question' });
    }

    return slots;
  }

  function buildAnswerTemplateSlotSequence() {
    var slots = [];
    var topicCount = QUIZ_CONFIG.RULES.TOPICS_PER_ROUND;
    var questionsPerTopic = QUIZ_CONFIG.RULES.QUESTIONS_PER_TOPIC;
    var bonusCount = QUIZ_CONFIG.RULES.BONUS_PER_ROUND;
    var totalAnswerSlides = (topicCount * questionsPerTopic) + bonusCount;
    var answerIndex;

    for (answerIndex = 0; answerIndex < totalAnswerSlides; answerIndex += 1) {
      slots.push({ type: 'answer' });
    }

    return slots;
  }

  function detectSlideType(presentation, slide, fallbackSlideIndex) {
    var markers = QUIZ_CONFIG.TEMPLATE_MARKERS;
    var pageText = getPageText(slide);
    var matchedTypes = [];

    if (pageText.indexOf(markers.TOPIC) !== -1) {
      matchedTypes.push('topic');
    }
    if (pageText.indexOf(markers.QUESTION) !== -1) {
      matchedTypes.push('question');
    }
    if (pageText.indexOf(markers.ANSWER) !== -1) {
      matchedTypes.push('answer');
    }

    if (matchedTypes.length > 1) {
      throw new Error(
        'Template slide ' + (fallbackSlideIndex || getSlidePosition(presentation, slide)) +
        ' contains multiple slide markers.'
      );
    }

    return matchedTypes.length ? matchedTypes[0] : null;
  }

  function removeRoundTemplateBlocks(templateBlocks) {
    var slidesToRemove = [];

    templateBlocks.forEach(function (templateBlock) {
      templateBlock.slots.forEach(function (slot) {
        slidesToRemove.push(slot.slide);
      });
    });

    slidesToRemove.reverse().forEach(function (slide) {
      slide.remove();
    });
  }

  function getPageText(page) {
    var textParts = [];

    page.getPageElements().forEach(function (element) {
      if (element.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
        textParts.push(element.asShape().getText().asString());
      }
    });

    return textParts.join('\n');
  }

  function replaceTokensOnSlide(slide, replacements, slideType, slideIndex) {
    var pageText = getPageText(slide);

    requiredTokensForType(slideType).forEach(function (token) {
      if (pageText.indexOf(token) === -1) {
        throw new Error(
          'Missing template token "' + token + '" on slide ' + slideIndex + '.'
        );
      }
    });

    replacements.forEach(function (replacement) {
      slide.replaceAllText(replacement.token, replacement.value);
    });
  }

  function requiredTokensForType(type) {
    var tokens = QUIZ_CONFIG.TEMPLATE_TOKENS;

    if (type === 'topic') {
      return [tokens.TOPIC_TITLE];
    }
    if (type === 'question') {
      return [tokens.QUESTION_TEXT];
    }
    return [tokens.ANSWER_TEXT];
  }

  function clearMarker(slide, marker) {
    slide.replaceAllText(marker, '');
  }

  function markerForType(type) {
    if (type === 'topic') {
      return QUIZ_CONFIG.TEMPLATE_MARKERS.TOPIC;
    }
    if (type === 'question') {
      return QUIZ_CONFIG.TEMPLATE_MARKERS.QUESTION;
    }
    return QUIZ_CONFIG.TEMPLATE_MARKERS.ANSWER;
  }

  function getSlidePosition(presentation, slide) {
    var slides = presentation.getSlides();
    var objectId = slide.getObjectId();
    var i;

    for (i = 0; i < slides.length; i += 1) {
      if (slides[i].getObjectId() === objectId) {
        return i + 1;
      }
    }

    return -1;
  }

  function summarizeRoundBlocks(roundBlocks) {
    var summary = {
      topicSlides: 0,
      questionSlides: 0,
      answerSlides: 0
    };

    roundBlocks.forEach(function (roundBlock) {
      roundBlock.slides.forEach(function (item) {
        if (item.type === 'topic') {
          summary.topicSlides += 1;
        } else if (item.type === 'question') {
          summary.questionSlides += 1;
        } else if (item.type === 'answer') {
          summary.answerSlides += 1;
        }
      });
    });

    return summary;
  }

  function movePresentationToSpreadsheetFolder(presentation, spreadsheet) {
    try {
      var presentationFile = DriveApp.getFileById(presentation.getId());
      var spreadsheetFile = DriveApp.getFileById(spreadsheet.getId());
      var parents = spreadsheetFile.getParents();

      if (parents.hasNext()) {
        var parentFolder = parents.next();
        parentFolder.addFile(presentationFile);

        // Keep Drive clean: remove the new file from root folder if it was placed there.
        DriveApp.getRootFolder().removeFile(presentationFile);
      }
    } catch (error) {
      Logger.log('Could not move presentation file to spreadsheet folder: ' + error.message);
    }
  }

  return {
    createPresentation: createPresentation
  };
})();
