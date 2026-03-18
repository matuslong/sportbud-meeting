var QuizSlidesService = (function () {
  function createPresentation(parsedQuiz, spreadsheet) {
    validateTemplateConfig();

    var timestamp = Utilities.formatDate(
      parsedQuiz.generatedAt,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm'
    );
    var renderItems = buildRenderItems(parsedQuiz.rounds);
    var templateFile = DriveApp.getFileById(QUIZ_CONFIG.TEMPLATE_PRESENTATION_ID);
    var presentationFile = templateFile.makeCopy(
      QUIZ_CONFIG.PROJECT_NAME + ' - ' + parsedQuiz.sourceSheetName + ' - ' + timestamp
    );
    var presentation = SlidesApp.openById(presentationFile.getId());

    fillTemplateSlides(presentation, renderItems);
    movePresentationToSpreadsheetFolder(presentation, spreadsheet);

    return {
      presentation: presentation,
      stats: summarizeRenderItems(renderItems)
    };
  }

  function validateTemplateConfig() {
    if (!QUIZ_CONFIG.TEMPLATE_PRESENTATION_ID ||
        QUIZ_CONFIG.TEMPLATE_PRESENTATION_ID === 'PASTE_TEMPLATE_PRESENTATION_ID_HERE') {
      throw new Error('Missing QUIZ_CONFIG.TEMPLATE_PRESENTATION_ID.');
    }
  }

  function buildRenderItems(rounds) {
    var renderItems = [];

    rounds.forEach(function (round) {
      round.topics.forEach(function (topic) {
        renderItems.push({
          type: 'topic',
          replacements: createTopicReplacements(round, topic)
        });
      });

      round.questions.forEach(function (item, index) {
        renderItems.push({
          type: 'question',
          replacements: createQuestionReplacements(round, item, index + 1)
        });
      });

      renderItems.push({
        type: 'question',
        replacements: createQuestionReplacements(
          round,
          round.bonusQuestion,
          round.questions.length + 1
        )
      });

      round.questions.forEach(function (item, index) {
        renderItems.push({
          type: 'answer',
          replacements: createAnswerReplacements(round, item, index + 1)
        });
      });

      renderItems.push({
        type: 'answer',
        replacements: createAnswerReplacements(
          round,
          round.bonusQuestion,
          round.questions.length + 1
        )
      });
    });

    return renderItems;
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

  function fillTemplateSlides(presentation, renderItems) {
    var templateSlides = findTemplateSlides(presentation);
    var insertionIndex = getInsertionIndex(templateSlides);
    var insertedSlides = [];

    renderItems.forEach(function (renderItem, index) {
      var duplicatedSlide = templateSlides[renderItem.type].slide.duplicate();
      duplicatedSlide.move(insertionIndex + index);
      replaceTokensOnSlide(
        duplicatedSlide,
        renderItem.replacements,
        renderItem.type,
        getSlidePosition(presentation, duplicatedSlide)
      );
      clearMarker(duplicatedSlide, markerForType(renderItem.type));
      insertedSlides.push(duplicatedSlide);
    });

    removeTemplateSlides(templateSlides);

    if (!insertedSlides.length) {
      throw new Error('No renderable quiz items were produced from the sheet.');
    }
  }

  function findTemplateSlides(presentation) {
    var templates = {
      topic: null,
      question: null,
      answer: null
    };

    presentation.getSlides().forEach(function (slide, index) {
      var matchedType = detectSlideType(presentation, slide, index + 1);

      if (!matchedType) {
        return;
      }

      if (templates[matchedType]) {
        throw new Error(
          'Template must contain exactly one "' + matchedType + '" marker slide. Found another on slide ' +
          (index + 1) + '.'
        );
      }

      templates[matchedType] = {
        slide: slide,
        slideIndex: index
      };
    });

    ['topic', 'question', 'answer'].forEach(function (type) {
      if (!templates[type]) {
        throw new Error(
          'Template is missing the "' + type + '" marker slide (' + markerForType(type) + ').'
        );
      }
    });

    return templates;
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

  function getInsertionIndex(templateSlides) {
    return Math.min(
      templateSlides.topic.slideIndex,
      templateSlides.question.slideIndex,
      templateSlides.answer.slideIndex
    );
  }

  function removeTemplateSlides(templateSlides) {
    templateSlides.topic.slide.remove();
    templateSlides.question.slide.remove();
    templateSlides.answer.slide.remove();
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

  function summarizeRenderItems(renderItems) {
    var summary = {
      topicSlides: 0,
      questionSlides: 0,
      answerSlides: 0
    };

    renderItems.forEach(function (item) {
      if (item.type === 'topic') {
        summary.topicSlides += 1;
      } else if (item.type === 'question') {
        summary.questionSlides += 1;
      } else if (item.type === 'answer') {
        summary.answerSlides += 1;
      }
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
