var QuizParser = (function () {
  function parseSpreadsheet(spreadsheet) {
    var baseSheet = getBaseSheet(spreadsheet);
    var riskSheet = spreadsheet.getSheetByName(QUIZ_CONFIG.RISK.SHEET_NAME);
    var baseQuiz = parseBaseSheet(baseSheet);
    var risk = parseRiskSheet(riskSheet);

    return {
      sourceSheetName: baseSheet.getName(),
      generatedAt: new Date(),
      rounds: baseQuiz.rounds,
      beerBonus: baseQuiz.beerBonus,
      risk: risk
    };
  }

  function parseBaseSheet(sheet) {
    var values = sheet.getDataRange().getValues();
    var rows = normalizeRows(values);

    if (!rows.length) {
      throw new Error('Sheet "' + sheet.getName() + '" does not contain quiz data.');
    }

    return parseRounds(rows);
  }

  function parseRiskSheet(sheet) {
    var values;
    var rows;

    if (!sheet) {
      throw new Error('Missing sheet "' + QUIZ_CONFIG.RISK.SHEET_NAME + '".');
    }

    values = sheet.getDataRange().getValues();
    rows = normalizeRiskRows(values);

    return {
      sheetName: sheet.getName(),
      categories: parseRiskCategories(rows)
    };
  }

  function getBaseSheet(spreadsheet) {
    var activeSheet = spreadsheet.getActiveSheet();
    var namedSheet;
    var fallbackSheet;

    if (activeSheet && activeSheet.getName() !== QUIZ_CONFIG.RISK.SHEET_NAME) {
      return activeSheet;
    }

    namedSheet = spreadsheet.getSheetByName(QUIZ_CONFIG.BASE_SHEET_NAME);
    if (namedSheet && namedSheet.getName() !== QUIZ_CONFIG.RISK.SHEET_NAME) {
      return namedSheet;
    }

    fallbackSheet = spreadsheet.getSheets().filter(function (sheet) {
      return sheet.getName() !== QUIZ_CONFIG.RISK.SHEET_NAME;
    })[0];

    if (!fallbackSheet) {
      throw new Error('Could not determine the base quiz sheet.');
    }

    return fallbackSheet;
  }

  function normalizeRows(values) {
    return values
      .map(function (row, index) {
        return {
          rowNumber: index + 1,
          orderRaw: toSafeString(row[QUIZ_CONFIG.SHEET_COLUMNS.ORDER]),
          text: toSafeString(row[QUIZ_CONFIG.SHEET_COLUMNS.TEXT]),
          answer: toSafeString(row[QUIZ_CONFIG.SHEET_COLUMNS.ANSWER])
        };
      })
      .filter(function (row) {
        return row.orderRaw || row.text || row.answer;
      });
  }

  function normalizeRiskRows(values) {
    return values.map(function (row, index) {
      return {
        rowNumber: index + 1,
        difficultyRaw: toSafeString(row[0]),
        text: toSafeString(row[1]),
        answer: toSafeString(row[2]),
        note: toSafeString(row[3])
      };
    });
  }

  function parseRounds(rows) {
    var rounds = [];
    var currentRound = createRound(1);
    var currentTopic = null;
    var beerBonus = null;

    rows.forEach(function (row) {
      if (isBeerBonusRow(row)) {
        if (beerBonus) {
          throw new Error('Beer bonus can only appear once. Row ' + row.rowNumber);
        }
        if (currentRound.topics.length || currentRound.bonusQuestion) {
          throw new Error(
            'Beer bonus must appear only after the last completed round. Row ' + row.rowNumber
          );
        }
        if (!rounds.length) {
          throw new Error('Beer bonus requires at least one completed round. Row ' + row.rowNumber);
        }
        if (!row.text || !row.answer) {
          throw new Error('Beer bonus is incomplete at row ' + row.rowNumber + '.');
        }

        beerBonus = {
          type: 'beerBonus',
          order: 'P',
          topicTitle: 'Pivný bonus',
          question: row.text,
          answer: row.answer,
          rowNumber: row.rowNumber
        };
        return;
      }

      if (isBonusRow(row)) {
        if (currentRound.bonusQuestion) {
          throw new Error(
            'Round ' + currentRound.number + ' has multiple bonus rows. Row ' + row.rowNumber
          );
        }

        currentRound.bonusQuestion = {
          type: 'bonus',
          order: 'B',
          topicTitle: 'Bonus',
          question: row.text,
          answer: row.answer,
          rowNumber: row.rowNumber
        };

        finalizeRound(currentRound, rounds);
        currentRound = createRound(currentRound.number + 1);
        currentTopic = null;
        return;
      }

      if (isTopicHeaderRow(row)) {
        currentTopic = {
          title: normalizeTopicTitle(row.text),
          questions: [],
          topicRowNumber: row.rowNumber
        };

        currentRound.topics.push(currentTopic);

        if (currentRound.topics.length > QUIZ_CONFIG.RULES.TOPICS_PER_ROUND) {
          throw new Error(
            'Round ' + currentRound.number + ' has more than ' +
              QUIZ_CONFIG.RULES.TOPICS_PER_ROUND + ' topics. Row ' + row.rowNumber
          );
        }

        return;
      }

      if (!currentTopic) {
        throw new Error('Question found before topic header. Row ' + row.rowNumber);
      }

      currentTopic.questions.push({
        order: row.orderRaw,
        question: row.text,
        answer: row.answer,
        rowNumber: row.rowNumber
      });
    });

    if (currentRound.topics.length || currentRound.bonusQuestion) {
      throw new Error(
        'Last round is incomplete. Every round must end with one bonus row (A = B).'
      );
    }

    if (!rounds.length) {
      throw new Error('No complete rounds detected in sheet.');
    }

    return {
      rounds: rounds,
      beerBonus: beerBonus
    };
  }

  function parseRiskCategories(rows) {
    var categories = [];
    var i = 0;

    while (i < rows.length) {
      if (categories.length === QUIZ_CONFIG.RISK.TOPIC_COUNT) {
        break;
      }

      var row = rows[i];

      if (isBlankRiskRow(row)) {
        i += 1;
        continue;
      }

      if (!isRiskHeaderRow(row)) {
        throw new Error(
          'Risk sheet expected a topic header row at row ' + row.rowNumber + '.'
        );
      }

      categories.push(parseRiskCategory(rows, i));
      i += QUIZ_CONFIG.RISK.QUESTIONS_PER_TOPIC + 1;
    }

    validateRiskCategories(categories);

    return categories;
  }

  function parseRiskCategory(rows, startIndex) {
    var headerRow = rows[startIndex];
    var title = headerRow.text;
    var questions = [];
    var offset;

    for (offset = 1; offset <= QUIZ_CONFIG.RISK.QUESTIONS_PER_TOPIC; offset += 1) {
      var row = rows[startIndex + offset];
      var expectedPoints = offset;
      var points;

      if (!row || isBlankRiskRow(row)) {
        throw new Error(
          'Risk topic "' + title + '" is missing question for ' + expectedPoints + ' point(s).'
        );
      }

      points = parseRiskPoints(row.difficultyRaw, row.rowNumber);
      if (points !== expectedPoints) {
        throw new Error(
          'Risk topic "' + title + '" expected difficulty ' + expectedPoints +
          ' at row ' + row.rowNumber + ', found ' + row.difficultyRaw + '.'
        );
      }

      if (!row.text) {
        throw new Error('Risk question text is missing at row ' + row.rowNumber + '.');
      }
      if (!row.answer) {
        throw new Error('Risk answer is missing at row ' + row.rowNumber + '.');
      }

      questions.push({
        points: points,
        question: row.text,
        answer: row.answer,
        rowNumber: row.rowNumber
      });
    }

    return {
      title: title,
      questions: questions
    };
  }

  function validateRound(round) {
    if (round.topics.length !== QUIZ_CONFIG.RULES.TOPICS_PER_ROUND) {
      throw new Error(
        'Round ' + round.number + ' must contain exactly ' +
          QUIZ_CONFIG.RULES.TOPICS_PER_ROUND + ' topics. Found: ' + round.topics.length
      );
    }

    round.topics.forEach(function (topic) {
      if (topic.questions.length !== QUIZ_CONFIG.RULES.QUESTIONS_PER_TOPIC) {
        throw new Error(
          'Topic "' + topic.title + '" in round ' + round.number + ' must contain exactly ' +
            QUIZ_CONFIG.RULES.QUESTIONS_PER_TOPIC + ' questions. Found: ' + topic.questions.length
        );
      }

      topic.questions.forEach(function (q) {
        if (!q.question) {
          throw new Error('Missing question text at row ' + q.rowNumber);
        }
        if (!q.answer) {
          throw new Error('Missing answer at row ' + q.rowNumber);
        }
      });
    });

    if (!round.bonusQuestion) {
      throw new Error('Round ' + round.number + ' is missing bonus question (A = B).');
    }

    if (!round.bonusQuestion.question || !round.bonusQuestion.answer) {
      throw new Error('Round ' + round.number + ' has incomplete bonus question.');
    }
  }

  function validateRiskCategories(categories) {
    if (categories.length !== QUIZ_CONFIG.RISK.TOPIC_COUNT) {
      throw new Error(
        'Risk sheet must contain exactly ' + QUIZ_CONFIG.RISK.TOPIC_COUNT +
        ' topics. Found: ' + categories.length + '.'
      );
    }
  }

  function finalizeRound(round, rounds) {
    validateRound(round);

    round.questions = flattenRoundQuestions(round.topics);
    round.title = 'Kolo ' + round.number + ' - ' + round.topics.map(function (t) {
      return t.title;
    }).join(' / ');

    rounds.push(round);
  }

  function flattenRoundQuestions(topics) {
    var items = [];

    topics.forEach(function (topic) {
      topic.questions.forEach(function (q) {
        items.push({
          type: 'question',
          topicTitle: topic.title,
          order: q.order,
          question: q.question,
          answer: q.answer
        });
      });
    });

    return items;
  }

  function createRound(number) {
    return {
      number: number,
      topics: [],
      bonusQuestion: null
    };
  }

  function isBonusRow(row) {
    return row.orderRaw.toUpperCase() === 'B';
  }

  function isBeerBonusRow(row) {
    return row.orderRaw.toUpperCase() === 'P';
  }

  function isTopicHeaderRow(row) {
    if (!row.text) {
      return false;
    }

    var orderToken = row.orderRaw.toUpperCase();
    var answerToken = row.answer.toUpperCase();

    if (orderToken === 'ORDER' && answerToken === 'ANSWER') {
      return true;
    }

    return !row.orderRaw && !row.answer;
  }

  function isBlankRiskRow(row) {
    return !row.difficultyRaw && !row.text && !row.answer && !row.note;
  }

  function isRiskHeaderRow(row) {
    return row.difficultyRaw.toUpperCase() === 'DIFFICULTY' &&
      row.answer.toUpperCase() === 'ANSWER' &&
      !!row.text;
  }

  function parseRiskPoints(rawValue, rowNumber) {
    var parsed = Number(rawValue);

    if (!parsed || parsed % 1 !== 0) {
      throw new Error(
        'Invalid Risk difficulty "' + rawValue + '" at row ' + rowNumber + '.'
      );
    }

    return parsed;
  }

  function toSafeString(value) {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  function normalizeTopicTitle(rawTitle) {
    var title = toSafeString(rawTitle);
    return title.replace(/^order\s+/i, '').trim();
  }

  return {
    parseSpreadsheet: parseSpreadsheet
  };
})();
