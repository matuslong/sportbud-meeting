function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(QUIZ_CONFIG.MENU_NAME)
    .addItem(QUIZ_CONFIG.MENU_ACTION_GENERATE, 'generateQuizPresentation')
    .addToUi();
}

function generateQuizPresentation() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var parsed = QuizParser.parseSpreadsheet(spreadsheet);
    var result = QuizSlidesService.createPresentation(parsed, spreadsheet);

    SpreadsheetApp.getUi().alert(
      'Presentation created.\n' +
      'Rounds: ' + parsed.rounds.length + '\n' +
      'Filled topic slides: ' + result.stats.topicSlides + '\n' +
      'Filled question slides: ' + result.stats.questionSlides + '\n' +
      'Filled answer slides: ' + result.stats.answerSlides + '\n' +
      'Beer bonus question slides: ' + result.stats.beerBonusQuestionSlides + '\n' +
      'Beer bonus answer slides: ' + result.stats.beerBonusAnswerSlides + '\n' +
      'Risk topics: ' + result.stats.riskTopicCount + '\n' +
      'Risk question slides: ' + result.stats.riskQuestionSlides + '\n' +
      'Risk answer slides: ' + result.stats.riskAnswerSlides + '\n' +
      'Total slides: ' + result.presentation.getSlides().length + '\n\n' +
      result.presentation.getUrl()
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert('Generation failed:\n' + error.message);
    throw error;
  }
}
