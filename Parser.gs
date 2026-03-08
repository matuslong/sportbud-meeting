var QuizParser = (function () {
  function parseSheet(sheet) {
    var values = sheet.getDataRange().getValues();
    var rows = normalizeRows(values);

    if (!rows.length) {
      throw new Error('Sheet does not contain quiz data.');
    }

    var rounds = parseRounds(rows);

    return {
      sourceSheetName: sheet.getName(),
      generatedAt: new Date(),
      rounds: rounds
    };
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

  function parseRounds(rows) {
    var rounds = [];
    var currentRound = createRound(1);
    var currentTopic = null;

    rows.forEach(function (row) {
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

    return rounds;
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

  function isTopicHeaderRow(row) {
    if (!row.text) {
      return false;
    }

    var orderToken = row.orderRaw.toUpperCase();
    var answerToken = row.answer.toUpperCase();

    // Supports user sheet format: A="Order", B=topic name, C="Answer".
    if (orderToken === 'ORDER' && answerToken === 'ANSWER') {
      return true;
    }

    // Fallback format: A empty, B=topic name, C empty.
    var hasQuestionOrder = row.orderRaw && !isBonusRow(row);
    return !hasQuestionOrder && !row.answer;
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
    parseSheet: parseSheet
  };
})();
