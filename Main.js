function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(QUIZ_CONFIG.MENU_NAME)
    .addItem(QUIZ_CONFIG.MENU_ACTION_GENERATE, 'generateQuizPresentation')
    .addToUi();
}

function generateQuizPresentation() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getActiveSheet();
    var parsed = QuizParser.parseSheet(sheet);
    var result = QuizSlidesService.createPresentation(parsed, spreadsheet);

    SpreadsheetApp.getUi().alert(
      'Presentation created.\n' +
      'Rounds: ' + parsed.rounds.length + '\n' +
      'Filled topic slides: ' + result.stats.topicSlides + '\n' +
      'Filled question slides: ' + result.stats.questionSlides + '\n' +
      'Filled answer slides: ' + result.stats.answerSlides + '\n' +
      'Total slides: ' + result.presentation.getSlides().length + '\n\n' +
      result.presentation.getUrl()
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert('Generation failed:\n' + error.message);
    throw error;
  }
}
