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
    var standingsData = getStandingsData();
    var standingsSlideIds;
    var roundBlocks;

    validateRoundTemplateCount(parsedQuiz.rounds, templateBlocks);
    roundBlocks = buildRoundBlocks(parsedQuiz.rounds, templateBlocks, standingsData);

    standingsSlideIds = fillQuizTemplateSlides(presentation, roundBlocks, templateBlocks);
    fillBeerBonusSection(presentation, parsedQuiz.beerBonus);
    fillRiskSection(presentation, parsedQuiz.risk);
    movePresentationToSpreadsheetFolder(presentation, spreadsheet);
    storeLastGeneratedPresentationState(presentation, standingsSlideIds);

    return {
      presentation: presentation,
      stats: summarizePresentation(roundBlocks, parsedQuiz.beerBonus, parsedQuiz.risk)
    };
  }

  function refreshStandingsSlides() {
    var state = getStoredStandingsState();
    var standingsData = getStandingsData();
    var presentation = SlidesApp.openById(state.presentationId);
    var slideMap = {};
    var stateChanged = false;

    presentation.getSlides().forEach(function (slide) {
      slideMap[slide.getObjectId()] = slide;
    });

    state.standingsSlideIds.forEach(function (slideState) {
      var slide = slideMap[slideState.slideId];
      var roundNumber = slideState.roundNumber;

      if (!slide) {
        throw new Error('Missing standings slide with object ID ' + slideState.slideId + '.');
      }

      if (!roundNumber) {
        roundNumber = detectStandingsRoundNumber(slide, getSlidePosition(presentation, slide));
        slideState.roundNumber = roundNumber;
        stateChanged = true;
      }

      var normalizedBindings = normalizeStoredStandingsBindings(slideState.bindings);

      if (normalizedBindings !== slideState.bindings) {
        stateChanged = true;
      }

      slideState.bindings = normalizedBindings;

      if (!slideState.bindings || !canPopulateStandingsSlideByBindings(slide, slideState.bindings)) {
        slideState.bindings = recaptureStandingsBindings(
          slide,
          roundNumber,
          getSlidePosition(presentation, slide)
        );
        stateChanged = true;
      }

      if (slideState.bindings) {
        populateRenderedStandingsSlideByBindings(
          slide,
          slideState.bindings,
          standingsData,
          roundNumber,
          getSlidePosition(presentation, slide)
        );
      } else {
        populateStandingsSlide(
          slide,
          standingsData,
          roundNumber,
          getSlidePosition(presentation, slide)
        );
      }
    });

    if (stateChanged) {
      storeLastGeneratedPresentationState(presentation, state.standingsSlideIds);
    }
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

  function buildRoundBlocks(rounds, templateBlocks, standingsData) {
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

      templateBlock.staticSlots.forEach(function (slot) {
        if (slot.type === 'standings') {
          slides.push({
            type: 'standings',
            standingsData: standingsData
          });
          return;
        }

        slides.push({ type: 'static' });
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

      templateBlock.trailingSlots.forEach(function (slot) {
        if (slot.type === 'standings') {
          slides.push({
            type: 'standings',
            standingsData: standingsData
          });
        } else {
          slides.push({ type: 'static' });
        }
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

  function fillQuizTemplateSlides(presentation, roundBlocks, templateBlocks) {
    var insertionIndex = templateBlocks[0].startIndex;
    var insertedSlides = [];
    var standingsSlides = [];

    if (!roundBlocks.length) {
      throw new Error('No renderable quiz items were produced from the sheet.');
    }

    roundBlocks.forEach(function (roundBlock, roundIndex) {
      var templateBlock = templateBlocks[roundIndex];

      roundBlock.slides.forEach(function (renderItem, slotIndex) {
        var templateSlide = templateBlock.slots[slotIndex];
        var duplicatedSlide = templateSlide.slide.duplicate();

        duplicatedSlide.move(insertionIndex + insertedSlides.length);

        if (renderItem.type === 'standings') {
          var roundNumber = detectStandingsRoundNumber(
            duplicatedSlide,
            getSlidePosition(presentation, duplicatedSlide)
          );
          var bindings = captureStandingsBindings(
            duplicatedSlide,
            roundNumber,
            getSlidePosition(presentation, duplicatedSlide)
          );

          populateStandingsSlide(
            duplicatedSlide,
            renderItem.standingsData,
            roundNumber,
            getSlidePosition(presentation, duplicatedSlide)
          );
          clearMarker(duplicatedSlide, markerForType(renderItem.type));
          standingsSlides.push({
            slideId: duplicatedSlide.getObjectId(),
            roundNumber: roundNumber,
            bindings: bindings
          });
        } else if (renderItem.type !== 'static') {
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

    return standingsSlides;
  }

  function fillRiskSection(presentation, riskData) {
    var template = findRiskTemplate(presentation, riskData);
    var flatQuestions = flattenRiskQuestions(riskData.categories);

    setRiskNavigationLinks(template.menuSlide, template.pairs);
    replaceRiskMenuTokens(template.menuSlide, riskData.categories);
    clearRiskMarker(template.menuSlide, QUIZ_CONFIG.RISK.TEMPLATE_MARKERS.MENU);

    flatQuestions.forEach(function (item, index) {
      var pair = template.pairs[index];
      var questionReplacements = createRiskQuestionReplacements(item);
      var answerReplacements = createRiskAnswerReplacements(item);

      replaceRiskTokensOnSlide(
        pair.questionSlide,
        questionReplacements,
        requiredRiskTokensForType('question'),
        getSlidePosition(presentation, pair.questionSlide)
      );
      clearRiskMarker(pair.questionSlide, QUIZ_CONFIG.RISK.TEMPLATE_MARKERS.QUESTION);

      replaceRiskTokensOnSlide(
        pair.answerSlide,
        answerReplacements,
        requiredRiskTokensForType('answer'),
        getSlidePosition(presentation, pair.answerSlide)
      );
      clearRiskMarker(pair.answerSlide, QUIZ_CONFIG.RISK.TEMPLATE_MARKERS.ANSWER);
    });

  }

  function fillBeerBonusSection(presentation, beerBonus) {
    if (!beerBonus) {
      return;
    }

    var template = findBeerBonusTemplate(presentation);

    replaceTokensOnSlide(
      template.questionSlide,
      [
        { token: QUIZ_CONFIG.TEMPLATE_TOKENS.QUESTION_TEXT, value: beerBonus.question }
      ],
      'question',
      getSlidePosition(presentation, template.questionSlide)
    );
    clearMarker(template.questionSlide, QUIZ_CONFIG.TEMPLATE_MARKERS.BEER_BONUS_QUESTION);

    replaceTokensOnSlide(
      template.answerSlide,
      [
        { token: QUIZ_CONFIG.TEMPLATE_TOKENS.QUESTION_TEXT, value: beerBonus.question },
        { token: QUIZ_CONFIG.TEMPLATE_TOKENS.ANSWER_TEXT, value: beerBonus.answer }
      ],
      'answer',
      getSlidePosition(presentation, template.answerSlide)
    );
    clearMarker(template.answerSlide, QUIZ_CONFIG.TEMPLATE_MARKERS.BEER_BONUS_ANSWER);
  }

  function findRoundTemplateBlocks(presentation) {
    var slides = presentation.getSlides();
    var blocks = [];
    var i;

    for (i = 0; i < slides.length; i += 1) {
      var slideType = detectQuizSlideType(presentation, slides[i], i + 1);
      var block;

      if (!slideType) {
        continue;
      }

      if (slideType !== 'topic') {
        throw new Error(
          'Template slide ' + (i + 1) +
          ' contains a "' + slideType + '" quiz marker outside a round block.'
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
    var trailingSlots = [];
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

      questionSlideType = detectQuizSlideType(presentation, questionSlide, cursor + 1);

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
      var staticSlideType = detectQuizSlideType(presentation, staticSlide, cursor + 1);

      if (staticSlideType === 'answer') {
        break;
      }

      if (staticSlideType && staticSlideType !== 'standings') {
        throw new Error(
          'Template round block ' + blockNumber +
          ' contains unexpected "' + staticSlideType +
          '" marker in the static promo section on slide ' + (cursor + 1) + '.'
        );
      }

      staticSlots.push({
        type: staticSlideType || 'static',
        slide: staticSlide
      });
      slots.push({
        type: staticSlideType || 'static',
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

      answerType = detectQuizSlideType(presentation, answerSlide, cursor + 1);

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

    while (cursor < slides.length) {
      var trailingSlide = slides[cursor];
      var trailingSlideType = detectQuizSlideType(presentation, trailingSlide, cursor + 1);

      if (trailingSlideType !== 'standings') {
        break;
      }

      trailingSlots.push({
        type: 'standings',
        slide: trailingSlide
      });
      slots.push({
        type: 'standings',
        slide: trailingSlide
      });
      cursor += 1;
    }

    return {
      startIndex: startIndex,
      endIndex: cursor - 1,
      staticSlots: staticSlots,
      trailingSlots: trailingSlots,
      slots: slots
    };
  }

  function findRiskTemplate(presentation, riskData) {
    var slides = presentation.getSlides();
    var menuIndex = findSlideIndexByMarker(slides, QUIZ_CONFIG.RISK.TEMPLATE_MARKERS.MENU);
    var expectedPairs = QUIZ_CONFIG.RISK.TOPIC_COUNT * QUIZ_CONFIG.RISK.QUESTIONS_PER_TOPIC;
    var pairs = [];
    var cursor = menuIndex + 1;
    var pairIndex;

    if (menuIndex === -1) {
      throw new Error(
        'Template is missing the Risk menu slide marker (' +
        QUIZ_CONFIG.RISK.TEMPLATE_MARKERS.MENU + ').'
      );
    }

    if (riskData.categories.length !== QUIZ_CONFIG.RISK.TOPIC_COUNT) {
      throw new Error(
        'Risk data contains ' + riskData.categories.length + ' topic(s), expected ' +
        QUIZ_CONFIG.RISK.TOPIC_COUNT + '.'
      );
    }

    for (pairIndex = 0; pairIndex < expectedPairs; pairIndex += 1) {
      var questionSlide = slides[cursor];
      var answerSlide = slides[cursor + 1];
      var questionType;
      var answerType;

      if (!questionSlide || !answerSlide) {
        throw new Error('Risk template is missing one or more question/answer slides.');
      }

      questionType = detectRiskSlideType(presentation, questionSlide, cursor + 1);
      answerType = detectRiskSlideType(presentation, answerSlide, cursor + 2);

      if (questionType !== 'question') {
        throw new Error(
          'Risk template expected a question slide at slide ' + (cursor + 1) +
          ', found "' + (questionType || 'none') + '".'
        );
      }

      if (answerType !== 'answer') {
        throw new Error(
          'Risk template expected an answer slide at slide ' + (cursor + 2) +
          ', found "' + (answerType || 'none') + '".'
        );
      }

      pairs.push({
        questionSlide: questionSlide,
        answerSlide: answerSlide
      });

      cursor += 2;
    }

    return {
      menuSlide: slides[menuIndex],
      pairs: pairs
    };
  }

  function findBeerBonusTemplate(presentation) {
    var slides = presentation.getSlides();
    var questionIndex = findSlideIndexByMarker(
      slides,
      QUIZ_CONFIG.TEMPLATE_MARKERS.BEER_BONUS_QUESTION
    );
    var answerIndex = findSlideIndexByMarker(
      slides,
      QUIZ_CONFIG.TEMPLATE_MARKERS.BEER_BONUS_ANSWER
    );

    if (questionIndex === -1 || answerIndex === -1) {
      throw new Error('Template is missing one or more beer bonus slides.');
    }

    return {
      questionSlide: slides[questionIndex],
      answerSlide: slides[answerIndex]
    };
  }

  function getStandingsData() {
    var standingsSheet = getStandingsSpreadsheet().getSheetByName(QUIZ_CONFIG.STANDINGS.SHEET_NAME);
    var firstRow = QUIZ_CONFIG.STANDINGS.FIRST_DATA_ROW;
    var roundPointsColumns = QUIZ_CONFIG.STANDINGS.ROUND_POINTS_COLUMNS;
    var totalPointsColumn = QUIZ_CONFIG.STANDINGS.TOTAL_POINTS_COLUMN;
    var maxColumn = Math.max.apply(null, roundPointsColumns.concat([totalPointsColumn]));
    var lastRow;
    var values;

    if (!standingsSheet) {
      throw new Error('Missing standings sheet "' + QUIZ_CONFIG.STANDINGS.SHEET_NAME + '".');
    }

    lastRow = standingsSheet.getLastRow();
    if (lastRow < firstRow) {
      return [];
    }

    values = standingsSheet.getRange(firstRow, 1, lastRow - firstRow + 1, maxColumn).getValues();

    return values
      .map(function (row, index) {
        return {
          position: toDisplayString(row[QUIZ_CONFIG.STANDINGS.POSITION_COLUMN - 1]) ||
            String(index + 1),
          teamName: toDisplayString(row[QUIZ_CONFIG.STANDINGS.TEAM_COLUMN - 1]),
          roundPoints: roundPointsColumns.map(function (columnIndex) {
            return toDisplayString(row[columnIndex - 1]);
          }),
          totalPoints: toDisplayString(row[QUIZ_CONFIG.STANDINGS.TOTAL_POINTS_COLUMN - 1])
        };
      })
      .filter(function (row) {
        return !!row.teamName;
      })
      .slice(0, QUIZ_CONFIG.STANDINGS.MAX_TEAMS);
  }

  function populateStandingsSlide(slide, standingsData, roundNumber, slideIndex) {
    if (hasStandingsTokens(slide)) {
      replaceStandingsTokensOnSlide(slide, standingsData, roundNumber, slideIndex);
      return;
    }

    replaceRenderedStandingsSlide(slide, standingsData, roundNumber, slideIndex);
  }

  function replaceStandingsTokensOnSlide(slide, standingsData, roundNumber, slideIndex) {
    var pageText = getPageText(slide);
    var replacements = createStandingsReplacements(standingsData, roundNumber);

    requiredStandingsTokens(roundNumber).forEach(function (token) {
      if (pageText.indexOf(token) === -1) {
        throw new Error(
          'Missing standings template token "' + token + '" on slide ' + slideIndex + '.'
        );
      }
    });

    replacements.forEach(function (replacement) {
      slide.replaceAllText(replacement.token, replacement.value);
    });
  }

  function hasStandingsTokens(slide) {
    var pageText = getPageText(slide);
    return pageText.indexOf(standingsPositionToken(1)) !== -1 ||
      pageText.indexOf(standingsRoundPointsToken(1)) !== -1 ||
      pageText.indexOf(standingsTotalPointsToken(1)) !== -1;
  }

  function createStandingsReplacements(standingsData, roundNumber) {
    var maxTeams = QUIZ_CONFIG.STANDINGS.MAX_TEAMS;
    var replacements = [
      {
        token: roundMarkerForNumber(roundNumber),
        value: QUIZ_CONFIG.STANDINGS.ROUND_HEADER_LABEL
      }
    ];
    var i;

    for (i = 0; i < maxTeams; i += 1) {
      var row = standingsData[i] || {};
      var teamIndex = i + 1;

      replacements.push(
        { token: standingsPositionToken(teamIndex), value: row.position || '' },
        { token: standingsTeamToken(teamIndex), value: row.teamName || '' },
        { token: standingsRoundPointsToken(teamIndex), value: getRoundPointsValue(row, roundNumber) },
        { token: standingsTotalPointsToken(teamIndex), value: row.totalPoints || '' }
      );
    }

    return replacements;
  }

  function requiredStandingsTokens(roundNumber) {
    var tokens = [roundMarkerForNumber(roundNumber)];
    var maxTeams = QUIZ_CONFIG.STANDINGS.MAX_TEAMS;
    var i;

    for (i = 1; i <= maxTeams; i += 1) {
      tokens.push(
        standingsPositionToken(i),
        standingsTeamToken(i),
        standingsRoundPointsToken(i),
        standingsTotalPointsToken(i)
      );
    }

    return tokens;
  }

  function detectStandingsRoundNumber(slide, slideIndex) {
    var pageText = getPageText(slide);
    var matchedRounds = [];

    QUIZ_CONFIG.STANDINGS.ROUND_MARKERS.forEach(function (marker, index) {
      if (pageText.indexOf(marker) !== -1) {
        matchedRounds.push(index + 1);
      }
    });

    if (matchedRounds.length !== 1) {
      throw new Error(
        'Standings slide ' + slideIndex + ' must contain exactly one round marker.'
      );
    }

    return matchedRounds[0];
  }

  function getRoundPointsValue(row, roundNumber) {
    if (!row || !row.roundPoints || !row.roundPoints[roundNumber - 1]) {
      return '';
    }

    return row.roundPoints[roundNumber - 1];
  }

  function replaceRenderedStandingsSlide(slide, standingsData, roundNumber, slideIndex) {
    var columns = getRenderedStandingsColumns(slide, slideIndex);
    var maxTeams = QUIZ_CONFIG.STANDINGS.MAX_TEAMS;
    var i;

    columns[2].header.getText().setText(QUIZ_CONFIG.STANDINGS.ROUND_HEADER_LABEL);

    for (i = 0; i < maxTeams; i += 1) {
      var row = standingsData[i] || {};

      columns[0].rows[i].getText().setText(row.position || '');
      columns[1].rows[i].getText().setText(row.teamName || '');
      columns[2].rows[i].getText().setText(getRoundPointsValue(row, roundNumber));
      columns[3].rows[i].getText().setText(row.totalPoints || '');
    }
  }

  function populateRenderedStandingsSlideByBindings(slide, bindings, standingsData, roundNumber, slideIndex) {
    var elementMaps = getStandingsElementMapsForSlide(slide);
    var headerText = getBoundStandingsTextRange(
      elementMaps,
      bindings && bindings.headerTarget,
      slideIndex
    );
    var maxTeams = QUIZ_CONFIG.STANDINGS.MAX_TEAMS;
    var i;

    headerText.setText(QUIZ_CONFIG.STANDINGS.ROUND_HEADER_LABEL);

    for (i = 0; i < maxTeams; i += 1) {
      var row = standingsData[i] || {};
      var rowBinding = bindings.rows[i];
      var positionText;
      var teamText;
      var roundPointsText;
      var totalPointsText;

      if (!rowBinding) {
        throw new Error('Missing standings row binding ' + (i + 1) + ' on slide ' + slideIndex + '.');
      }

      positionText = getBoundStandingsTextRange(elementMaps, rowBinding.positionTarget, slideIndex);
      teamText = getBoundStandingsTextRange(elementMaps, rowBinding.teamTarget, slideIndex);
      roundPointsText = getBoundStandingsTextRange(elementMaps, rowBinding.roundPointsTarget, slideIndex);
      totalPointsText = getBoundStandingsTextRange(elementMaps, rowBinding.totalPointsTarget, slideIndex);

      positionText.setText(row.position || '');
      teamText.setText(row.teamName || '');
      roundPointsText.setText(getRoundPointsValue(row, roundNumber));
      totalPointsText.setText(row.totalPoints || '');
    }
  }

  function canPopulateStandingsSlideByBindings(slide, bindings) {
    try {
      validateStandingsBindings(slide, bindings, null);
      return true;
    } catch (error) {
      return false;
    }
  }

  function validateStandingsBindings(slide, bindings, slideIndex) {
    var elementMaps = getStandingsElementMapsForSlide(slide);
    var maxTeams = QUIZ_CONFIG.STANDINGS.MAX_TEAMS;
    var i;

    getBoundStandingsTextRange(elementMaps, bindings && bindings.headerTarget, slideIndex);

    for (i = 0; i < maxTeams; i += 1) {
      var rowBinding = bindings && bindings.rows ? bindings.rows[i] : null;

      if (!rowBinding) {
        throw new Error('Missing standings row binding ' + (i + 1) + buildStandingsSlideSuffix(slideIndex) + '.');
      }

      getBoundStandingsTextRange(elementMaps, rowBinding.positionTarget, slideIndex);
      getBoundStandingsTextRange(elementMaps, rowBinding.teamTarget, slideIndex);
      getBoundStandingsTextRange(elementMaps, rowBinding.roundPointsTarget, slideIndex);
      getBoundStandingsTextRange(elementMaps, rowBinding.totalPointsTarget, slideIndex);
    }
  }

  function getRenderedStandingsColumns(slide, slideIndex) {
    var textShapes = getTextShapesOnSlide(slide);
    var columns = groupStandingsColumns(textShapes, slideIndex);

    columns.forEach(function (column, columnIndex) {
      if (column.shapes.length < QUIZ_CONFIG.STANDINGS.MAX_TEAMS + 1) {
        throw new Error(
          'Standings slide ' + slideIndex + ' column ' + (columnIndex + 1) +
          ' has only ' + column.shapes.length + ' text items; expected at least ' +
          (QUIZ_CONFIG.STANDINGS.MAX_TEAMS + 1) + '.'
        );
      }

      column.shapes.sort(function (a, b) {
        return a.getTop() - b.getTop();
      });
      column.header = column.shapes[0];
      column.rows = column.shapes.slice(1, QUIZ_CONFIG.STANDINGS.MAX_TEAMS + 1);
    });

    return columns;
  }

  function getTextShapesOnSlide(slide) {
    var shapes = [];

    slide.getPageElements().forEach(function (element) {
      collectShapesFromElement(element, shapes);
    });

    return shapes;
  }

  function collectShapesFromElement(element, shapes) {
    if (element.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
      shapes.push(element.asShape());
      return;
    }

    if (element.getPageElementType() === SlidesApp.PageElementType.GROUP) {
      element.asGroup().getChildren().forEach(function (child) {
        collectShapesFromElement(child, shapes);
      });
    }
  }

  function groupStandingsColumns(textShapes, slideIndex) {
    var tolerance = 40;
    var groups = [];

    textShapes.slice().sort(function (a, b) {
      return a.getLeft() - b.getLeft();
    }).forEach(function (shape) {
      var left = shape.getLeft();
      var matchedGroup = null;

      groups.forEach(function (group) {
        if (!matchedGroup && Math.abs(left - group.left) <= tolerance) {
          matchedGroup = group;
        }
      });

      if (!matchedGroup) {
        matchedGroup = {
          left: left,
          shapes: []
        };
        groups.push(matchedGroup);
      }

      matchedGroup.shapes.push(shape);
      matchedGroup.left = averageLeft(matchedGroup.shapes);
    });
 
    groups = groups
      .filter(function (group) {
        return group.shapes.length >= QUIZ_CONFIG.STANDINGS.MAX_TEAMS + 1;
      })
      .sort(function (a, b) {
        if (b.shapes.length !== a.shapes.length) {
          return b.shapes.length - a.shapes.length;
        }
        return a.left - b.left;
      })
      .slice(0, 4)
      .sort(function (a, b) {
        return a.left - b.left;
      });

    if (groups.length !== 4) {
      throw new Error(
        'Standings slide ' + slideIndex + ' must contain 4 text columns with at least ' +
        (QUIZ_CONFIG.STANDINGS.MAX_TEAMS + 1) + ' items each.'
      );
    }

    return groups;
  }

  function averageLeft(shapes) {
    var total = 0;

    shapes.forEach(function (shape) {
      total += shape.getLeft();
    });

    return total / shapes.length;
  }

  function roundMarkerForNumber(roundNumber) {
    var marker = QUIZ_CONFIG.STANDINGS.ROUND_MARKERS[roundNumber - 1];

    if (!marker) {
      throw new Error('Unsupported standings round number ' + roundNumber + '.');
    }

    return marker;
  }

  function standingsPositionToken(index) {
    return '{{STANDINGS_POS_' + index + '}}';
  }

  function standingsTeamToken(index) {
    return '{{STANDINGS_TEAM_' + index + '}}';
  }

  function standingsRoundPointsToken(index) {
    return '{{RP' + index + '}}';
  }

  function standingsTotalPointsToken(index) {
    return '{{STANDINGS_POINTS_' + index + '}}';
  }

  function captureStandingsBindings(slide, roundNumber, slideIndex) {
    var maxTeams = QUIZ_CONFIG.STANDINGS.MAX_TEAMS;
    var bindings = {
      headerTarget: getSingleStandingsTargetForToken(slide, roundMarkerForNumber(roundNumber), slideIndex),
      rows: []
    };
    var i;

    for (i = 1; i <= maxTeams; i += 1) {
      bindings.rows.push({
        positionTarget: getSingleStandingsTargetForToken(slide, standingsPositionToken(i), slideIndex),
        teamTarget: getSingleStandingsTargetForToken(slide, standingsTeamToken(i), slideIndex),
        roundPointsTarget: getSingleStandingsTargetForToken(slide, standingsRoundPointsToken(i), slideIndex),
        totalPointsTarget: getSingleStandingsTargetForToken(slide, standingsTotalPointsToken(i), slideIndex)
      });
    }

    return bindings;
  }

  function recaptureStandingsBindings(slide, roundNumber, slideIndex) {
    if (hasStandingsTokens(slide)) {
      return captureStandingsBindings(slide, roundNumber, slideIndex);
    }

    try {
      return captureStandingsTableBindings(slide, slideIndex);
    } catch (error) {
      return null;
    }
  }

  function captureStandingsTableBindings(slide, slideIndex) {
    var maxTeams = QUIZ_CONFIG.STANDINGS.MAX_TEAMS;
    var tables = getStandingsTablesOnSlide(slide);
    var table;
    var bindings;
    var i;

    if (tables.length !== 1) {
      throw new Error(
        'Standings slide ' + slideIndex + ' must contain exactly one standings table.'
      );
    }

    table = tables[0];
    bindings = {
      headerTarget: createTableCellTarget(table.getObjectId(), 0, 2),
      rows: []
    };

    for (i = 1; i <= maxTeams; i += 1) {
      bindings.rows.push({
        positionTarget: createTableCellTarget(table.getObjectId(), i, 0),
        teamTarget: createTableCellTarget(table.getObjectId(), i, 1),
        roundPointsTarget: createTableCellTarget(table.getObjectId(), i, 2),
        totalPointsTarget: createTableCellTarget(table.getObjectId(), i, 3)
      });
    }

    return bindings;
  }

  function getSingleStandingsTargetForToken(slide, token, slideIndex) {
    var targets = findStandingsTargetsContainingText(slide, token);

    if (targets.length !== 1) {
      throw new Error(
        'Expected exactly one standings target containing "' + token + '" on slide ' +
        slideIndex + '.'
      );
    }

    return targets[0];
  }

  function getStandingsElementMapsForSlide(slide) {
    var shapeMap = {};
    var tableMap = {};

    slide.getPageElements().forEach(function (element) {
      collectStandingsElementMapEntries(element, shapeMap, tableMap);
    });

    return {
      shapeMap: shapeMap,
      tableMap: tableMap
    };
  }

  function collectStandingsElementMapEntries(element, shapeMap, tableMap) {
    if (element.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
      shapeMap[element.getObjectId()] = element.asShape();
      return;
    }

    if (element.getPageElementType() === SlidesApp.PageElementType.TABLE) {
      tableMap[element.getObjectId()] = element.asTable();
      return;
    }

    if (element.getPageElementType() === SlidesApp.PageElementType.GROUP) {
      element.asGroup().getChildren().forEach(function (child) {
        collectStandingsElementMapEntries(child, shapeMap, tableMap);
      });
    }
  }

  function findStandingsTargetsContainingText(slide, searchText) {
    var matches = [];

    slide.getPageElements().forEach(function (element) {
      collectMatchingStandingsTargetsFromElement(element, searchText, matches);
    });

    return matches;
  }

  function collectMatchingStandingsTargetsFromElement(element, searchText, matches) {
    var rowCount;
    var rowIndex;
    var columnCount;
    var columnIndex;
    var cellText;

    if (element.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
      var shape = element.asShape();
      if (shape.getText().asString().indexOf(searchText) !== -1) {
        matches.push(createShapeTarget(shape.getObjectId()));
      }
      return;
    }

    if (element.getPageElementType() === SlidesApp.PageElementType.TABLE) {
      rowCount = element.asTable().getNumRows();

      for (rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
        columnCount = element.asTable().getRow(rowIndex).getNumCells();

        for (columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
          cellText = element.asTable().getCell(rowIndex, columnIndex).getText().asString();

          if (cellText.indexOf(searchText) !== -1) {
            matches.push(
              createTableCellTarget(element.getObjectId(), rowIndex, columnIndex)
            );
          }
        }
      }
      return;
    }

    if (element.getPageElementType() === SlidesApp.PageElementType.GROUP) {
      element.asGroup().getChildren().forEach(function (child) {
        collectMatchingStandingsTargetsFromElement(child, searchText, matches);
      });
    }
  }

  function createShapeTarget(shapeId) {
    return {
      type: 'shape',
      shapeId: shapeId
    };
  }

  function createTableCellTarget(tableId, rowIndex, columnIndex) {
    return {
      type: 'tableCell',
      tableId: tableId,
      rowIndex: rowIndex,
      columnIndex: columnIndex
    };
  }

  function normalizeStoredStandingsBindings(bindings) {
    if (!bindings) {
      return null;
    }

    if (bindings.headerTarget && Array.isArray(bindings.rows)) {
      return bindings;
    }

    if (!bindings.headerShapeId || !Array.isArray(bindings.rows)) {
      return null;
    }

    return {
      headerTarget: createShapeTarget(bindings.headerShapeId),
      rows: bindings.rows.map(function (rowBinding) {
        if (!rowBinding) {
          return null;
        }

        return {
          positionTarget: rowBinding.positionTarget || createShapeTarget(rowBinding.positionShapeId),
          teamTarget: rowBinding.teamTarget || createShapeTarget(rowBinding.teamShapeId),
          roundPointsTarget: rowBinding.roundPointsTarget || createShapeTarget(rowBinding.roundPointsShapeId),
          totalPointsTarget: rowBinding.totalPointsTarget || createShapeTarget(rowBinding.totalPointsShapeId)
        };
      })
    };
  }

  function getBoundStandingsTextRange(elementMaps, target, slideIndex) {
    var table;
    var row;

    if (!target || !target.type) {
      throw new Error('Missing standings binding target' + buildStandingsSlideSuffix(slideIndex) + '.');
    }

    if (target.type === 'shape') {
      var shape = elementMaps.shapeMap[target.shapeId];

      if (!shape) {
        throw new Error('Missing bound standings shape' + buildStandingsSlideSuffix(slideIndex) + '.');
      }

      return shape.getText();
    }

    if (target.type === 'tableCell') {
      table = elementMaps.tableMap[target.tableId];

      if (!table) {
        throw new Error('Missing bound standings table' + buildStandingsSlideSuffix(slideIndex) + '.');
      }
      if (target.rowIndex >= table.getNumRows()) {
        throw new Error('Missing bound standings table row' + buildStandingsSlideSuffix(slideIndex) + '.');
      }

      row = table.getRow(target.rowIndex);
      if (target.columnIndex >= row.getNumCells()) {
        throw new Error('Missing bound standings table cell' + buildStandingsSlideSuffix(slideIndex) + '.');
      }

      return table.getCell(target.rowIndex, target.columnIndex).getText();
    }

    throw new Error('Unsupported standings binding target type "' + target.type + '"' +
      buildStandingsSlideSuffix(slideIndex) + '.');
  }

  function buildStandingsSlideSuffix(slideIndex) {
    return slideIndex ? ' on slide ' + slideIndex : '';
  }

  function getStandingsTablesOnSlide(slide) {
    var tables = [];

    slide.getPageElements().forEach(function (element) {
      collectStandingsTablesFromElement(element, tables);
    });

    return tables.filter(function (table) {
      return table.getNumRows() >= QUIZ_CONFIG.STANDINGS.MAX_TEAMS + 1 &&
        table.getRow(0).getNumCells() >= 4;
    });
  }

  function collectStandingsTablesFromElement(element, tables) {
    if (element.getPageElementType() === SlidesApp.PageElementType.TABLE) {
      tables.push(element.asTable());
      return;
    }

    if (element.getPageElementType() === SlidesApp.PageElementType.GROUP) {
      element.asGroup().getChildren().forEach(function (child) {
        collectStandingsTablesFromElement(child, tables);
      });
    }
  }

  function getStandingsSpreadsheet() {
    return SpreadsheetApp.openById(QUIZ_CONFIG.STANDINGS.SPREADSHEET_ID);
  }

  function flattenRiskQuestions(categories) {
    var items = [];

    categories.forEach(function (category, categoryIndex) {
      category.questions.forEach(function (question, questionIndex) {
        items.push({
          topicTitle: category.title,
          topicIndex: categoryIndex + 1,
          questionIndex: questionIndex + 1,
          points: question.points,
          question: question.question,
          answer: question.answer
        });
      });
    });

    return items;
  }

  function createRiskQuestionReplacements(item) {
    return [
      { token: QUIZ_CONFIG.RISK.TEMPLATE_TOKENS.TOPIC_TITLE, value: item.topicTitle },
      { token: QUIZ_CONFIG.RISK.TEMPLATE_TOKENS.POINTS_LABEL, value: formatPointsLabel(item.points) },
      { token: QUIZ_CONFIG.RISK.TEMPLATE_TOKENS.QUESTION_TEXT, value: item.question }
    ];
  }

  function createRiskAnswerReplacements(item) {
    return [
      { token: QUIZ_CONFIG.RISK.TEMPLATE_TOKENS.POINTS_LABEL, value: formatPointsLabel(item.points) },
      { token: QUIZ_CONFIG.RISK.TEMPLATE_TOKENS.QUESTION_TEXT, value: item.question },
      { token: QUIZ_CONFIG.RISK.TEMPLATE_TOKENS.ANSWER_TEXT, value: item.answer }
    ];
  }

  function replaceRiskMenuTokens(menuSlide, categories) {
    categories.forEach(function (category, categoryIndex) {
      menuSlide.replaceAllText(riskMenuTopicToken(categoryIndex + 1), category.title);

      category.questions.forEach(function (question, questionIndex) {
        replaceTextInMatchingShape(
          menuSlide,
          riskMenuQuestionToken(categoryIndex + 1, questionIndex + 1),
          formatPointsLabel(question.points)
        );
      });
    });
  }

  function replaceRiskTokensOnSlide(slide, replacements, requiredTokens, slideIndex) {
    var pageText = getPageText(slide);

    requiredTokens.forEach(function (token) {
      if (pageText.indexOf(token) === -1) {
        throw new Error(
          'Missing Risk template token "' + token + '" on slide ' + slideIndex + '.'
        );
      }
    });

    replacements.forEach(function (replacement) {
      slide.replaceAllText(replacement.token, replacement.value);
    });
  }

  function requiredRiskTokensForType(type) {
    var tokens = QUIZ_CONFIG.RISK.TEMPLATE_TOKENS;

    if (type === 'question') {
      return [tokens.TOPIC_TITLE, tokens.POINTS_LABEL, tokens.QUESTION_TEXT];
    }

    return [tokens.POINTS_LABEL, tokens.QUESTION_TEXT, tokens.ANSWER_TEXT];
  }

  function setRiskNavigationLinks(menuSlide, pairs) {
    pairs.forEach(function (pair, index) {
      var categoryIndex = Math.floor(index / QUIZ_CONFIG.RISK.QUESTIONS_PER_TOPIC) + 1;
      var questionIndex = (index % QUIZ_CONFIG.RISK.QUESTIONS_PER_TOPIC) + 1;

      setShapeLinkToSlide(
        menuSlide,
        riskMenuQuestionToken(categoryIndex, questionIndex),
        pair.questionSlide
      );
      setShapeLinksByText(pair.questionSlide, QUIZ_CONFIG.RISK.BACK_LINK_TEXT, menuSlide);
      setShapeLinksByText(pair.answerSlide, QUIZ_CONFIG.RISK.BACK_LINK_TEXT, menuSlide);
    });
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

  function detectQuizSlideType(presentation, slide, fallbackSlideIndex) {
    return detectMarkerType(
      presentation,
      slide,
      fallbackSlideIndex,
      [
        { type: 'topic', marker: QUIZ_CONFIG.TEMPLATE_MARKERS.TOPIC },
        { type: 'question', marker: QUIZ_CONFIG.TEMPLATE_MARKERS.QUESTION },
        { type: 'answer', marker: QUIZ_CONFIG.TEMPLATE_MARKERS.ANSWER },
        { type: 'standings', marker: QUIZ_CONFIG.TEMPLATE_MARKERS.ROUND_STANDINGS }
      ]
    );
  }

  function detectRiskSlideType(presentation, slide, fallbackSlideIndex) {
    return detectMarkerType(
      presentation,
      slide,
      fallbackSlideIndex,
      [
        { type: 'menu', marker: QUIZ_CONFIG.RISK.TEMPLATE_MARKERS.MENU },
        { type: 'question', marker: QUIZ_CONFIG.RISK.TEMPLATE_MARKERS.QUESTION },
        { type: 'answer', marker: QUIZ_CONFIG.RISK.TEMPLATE_MARKERS.ANSWER }
      ]
    );
  }

  function detectMarkerType(presentation, slide, fallbackSlideIndex, markerEntries) {
    var pageText = getPageText(slide);
    var matchedTypes = [];

    markerEntries.forEach(function (entry) {
      if (pageText.indexOf(entry.marker) !== -1) {
        matchedTypes.push(entry.type);
      }
    });

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
      collectTextPartsFromElement(element, textParts);
    });

    return textParts.join('\n');
  }

  function collectTextPartsFromElement(element, textParts) {
    if (element.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
      textParts.push(element.asShape().getText().asString());
      return;
    }

    if (element.getPageElementType() === SlidesApp.PageElementType.TABLE) {
      var table = element.asTable();
      var rowCount = table.getNumRows();
      var rowIndex;
      var columnIndex;

      for (rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
        var columnCount = table.getRow(rowIndex).getNumCells();

        for (columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
          textParts.push(table.getCell(rowIndex, columnIndex).getText().asString());
        }
      }
      return;
    }

    if (element.getPageElementType() === SlidesApp.PageElementType.GROUP) {
      element.asGroup().getChildren().forEach(function (child) {
        collectTextPartsFromElement(child, textParts);
      });
    }
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

  function clearRiskMarker(slide, marker) {
    slide.replaceAllText(marker, '');
  }

  function markerForType(type) {
    if (type === 'topic') {
      return QUIZ_CONFIG.TEMPLATE_MARKERS.TOPIC;
    }
    if (type === 'question') {
      return QUIZ_CONFIG.TEMPLATE_MARKERS.QUESTION;
    }
    if (type === 'standings') {
      return QUIZ_CONFIG.TEMPLATE_MARKERS.ROUND_STANDINGS;
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

  function findSlideIndexByMarker(slides, marker) {
    var i;

    for (i = 0; i < slides.length; i += 1) {
      if (getPageText(slides[i]).indexOf(marker) !== -1) {
        return i;
      }
    }

    return -1;
  }

  function replaceTextInMatchingShape(slide, searchText, replacement) {
    var shapes = findShapesContainingText(slide, searchText);

    if (shapes.length !== 1) {
      throw new Error(
        'Expected exactly one shape containing "' + searchText + '" on slide ' +
        getSlidePositionForPage(slide) + '.'
      );
    }

    shapes[0].getText().replaceAllText(searchText, replacement);
  }

  function setShapeLinkToSlide(slide, searchText, targetSlide) {
    var shapes = findShapesContainingText(slide, searchText);

    if (shapes.length !== 1) {
      throw new Error(
        'Expected exactly one link target containing "' + searchText + '" on slide ' +
        getSlidePositionForPage(slide) + '.'
      );
    }

    shapes[0].getText().getTextStyle().setLinkSlide(targetSlide);
  }

  function setShapeLinksByText(slide, searchText, targetSlide) {
    var shapes = findShapesContainingText(slide, searchText);

    if (!shapes.length) {
      throw new Error(
        'Missing "' + searchText + '" link target on slide ' + getSlidePositionForPage(slide) + '.'
      );
    }

    shapes.forEach(function (shape) {
      shape.getText().getTextStyle().setLinkSlide(targetSlide);
      shape.getText().getTextStyle()
        .setForegroundColor(QUIZ_CONFIG.RISK.BACK_LINK_COLOR)
        .setUnderline(false);
    });
  }

  function findShapesContainingText(slide, searchText) {
    var matches = [];

    slide.getPageElements().forEach(function (element) {
      collectMatchingShapesFromElement(element, searchText, matches);
    });

    return matches;
  }

  function collectMatchingShapesFromElement(element, searchText, matches) {
    if (element.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
      var shape = element.asShape();
      if (shape.getText().asString().indexOf(searchText) !== -1) {
        matches.push(shape);
      }
      return;
    }

    if (element.getPageElementType() === SlidesApp.PageElementType.GROUP) {
      element.asGroup().getChildren().forEach(function (child) {
        collectMatchingShapesFromElement(child, searchText, matches);
      });
    }
  }

  function getSlidePositionForPage(slide) {
    return slide.getObjectId();
  }

  function riskMenuTopicToken(topicIndex) {
    return '{{RISK_MENU_TOPIC_' + topicIndex + '}}';
  }

  function riskMenuQuestionToken(topicIndex, questionIndex) {
    return '{{RISK_MENU_' + topicIndex + '_' + questionIndex + '}}';
  }

  function toDisplayString(value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return String(value).trim();
  }

  function formatPointsLabel(points) {
    if (points === 1) {
      return '1 bod';
    }
    if (points >= 2 && points <= 4) {
      return points + ' body';
    }
    return points + ' bodů';
  }

  function summarizePresentation(roundBlocks, beerBonus, riskData) {
    var summary = {
      topicSlides: 0,
      questionSlides: 0,
      answerSlides: 0,
      standingsSlides: 0,
      beerBonusQuestionSlides: beerBonus ? 1 : 0,
      beerBonusAnswerSlides: beerBonus ? 1 : 0,
      riskTopicCount: riskData.categories.length,
      riskQuestionSlides: 0,
      riskAnswerSlides: 0
    };

    roundBlocks.forEach(function (roundBlock) {
      roundBlock.slides.forEach(function (item) {
        if (item.type === 'topic') {
          summary.topicSlides += 1;
        } else if (item.type === 'question') {
          summary.questionSlides += 1;
        } else if (item.type === 'answer') {
          summary.answerSlides += 1;
        } else if (item.type === 'standings') {
          summary.standingsSlides += 1;
        }
      });
    });

    riskData.categories.forEach(function (category) {
      summary.riskQuestionSlides += category.questions.length;
      summary.riskAnswerSlides += category.questions.length;
    });

    return summary;
  }

  function storeLastGeneratedPresentationState(presentation, standingsSlideIds) {
    var properties = PropertiesService.getScriptProperties();
    var serializedSlideIds = JSON.stringify(standingsSlideIds || []);

    properties.setProperty(QUIZ_CONFIG.STANDINGS.LAST_PRESENTATION_PROPERTY, presentation.getId());
    properties.setProperty(QUIZ_CONFIG.STANDINGS.LAST_STANDINGS_SLIDES_PROPERTY, serializedSlideIds);

    setStandingsMetaValue(QUIZ_CONFIG.STANDINGS.LAST_PRESENTATION_PROPERTY, presentation.getId());
    setStandingsMetaValue(QUIZ_CONFIG.STANDINGS.LAST_STANDINGS_SLIDES_PROPERTY, serializedSlideIds);
  }

  function getStoredStandingsState() {
    var presentationId = getStandingsMetaValue(QUIZ_CONFIG.STANDINGS.LAST_PRESENTATION_PROPERTY) ||
      PropertiesService.getScriptProperties().getProperty(QUIZ_CONFIG.STANDINGS.LAST_PRESENTATION_PROPERTY);
    var serializedSlideIds = getStandingsMetaValue(QUIZ_CONFIG.STANDINGS.LAST_STANDINGS_SLIDES_PROPERTY) ||
      PropertiesService.getScriptProperties().getProperty(QUIZ_CONFIG.STANDINGS.LAST_STANDINGS_SLIDES_PROPERTY);
    var standingsSlideIds = parseStoredSlideIds(serializedSlideIds);

    if (!presentationId) {
      throw new Error('No generated presentation is stored for standings refresh yet.');
    }

    if (!standingsSlideIds.length) {
      throw new Error('No stored standings slide IDs were found for refresh.');
    }

    return {
      presentationId: presentationId,
      standingsSlideIds: standingsSlideIds
    };
  }

  function parseStoredSlideIds(serializedSlideIds) {
    if (!serializedSlideIds) {
      return [];
    }

    try {
      var parsed = JSON.parse(serializedSlideIds);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map(function (item) {
        if (typeof item === 'string') {
          return {
            slideId: item,
            roundNumber: null
          };
        }

        return {
          slideId: item && item.slideId ? item.slideId : null,
          roundNumber: item && item.roundNumber ? item.roundNumber : null,
          bindings: item && item.bindings ? item.bindings : null
        };
      }).filter(function (item) {
        return !!item.slideId;
      });
    } catch (error) {
      throw new Error('Stored standings slide IDs are invalid JSON.');
    }
  }

  function getStandingsMetaSheet() {
    var spreadsheet = getStandingsSpreadsheet();
    var sheet = spreadsheet.getSheetByName(QUIZ_CONFIG.STANDINGS.META_SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(QUIZ_CONFIG.STANDINGS.META_SHEET_NAME);
      sheet.hideSheet();
    }

    return sheet;
  }

  function setStandingsMetaValue(key, value) {
    var sheet = getStandingsMetaSheet();
    var row = findMetaRow(sheet, key);

    if (row === -1) {
      row = Math.max(sheet.getLastRow() + 1, 1);
    }

    sheet.getRange(row, 1, 1, 2).setValues([[key, value]]);
  }

  function getStandingsMetaValue(key) {
    var sheet = getStandingsMetaSheet();
    var row = findMetaRow(sheet, key);

    if (row === -1) {
      return '';
    }

    return toDisplayString(sheet.getRange(row, 2).getValue());
  }

  function findMetaRow(sheet, key) {
    var lastRow = sheet.getLastRow();
    var values;
    var i;

    if (!lastRow) {
      return -1;
    }

    values = sheet.getRange(1, 1, lastRow, 1).getValues();

    for (i = 0; i < values.length; i += 1) {
      if (toDisplayString(values[i][0]) === key) {
        return i + 1;
      }
    }

    return -1;
  }

  function movePresentationToSpreadsheetFolder(presentation, spreadsheet) {
    try {
      var presentationFile = DriveApp.getFileById(presentation.getId());
      var spreadsheetFile = DriveApp.getFileById(spreadsheet.getId());
      var parents = spreadsheetFile.getParents();

      if (parents.hasNext()) {
        var parentFolder = parents.next();
        parentFolder.addFile(presentationFile);
        DriveApp.getRootFolder().removeFile(presentationFile);
      }
    } catch (error) {
      Logger.log('Could not move presentation file to spreadsheet folder: ' + error.message);
    }
  }

  return {
    createPresentation: createPresentation,
    refreshStandingsSlides: refreshStandingsSlides
  };
})();
