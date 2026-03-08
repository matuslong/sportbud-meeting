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
    var presentation = QuizSlidesService.createPresentation(parsed, spreadsheet);
    var slideCount = presentation.getSlides().length;

    SpreadsheetApp.getUi().alert(
      'Presentation created.\n' +
      'Rounds: ' + parsed.rounds.length + '\n' +
      'Slides: ' + slideCount + '\n\n' +
      presentation.getUrl()
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert('Generation failed:\n' + error.message);
    throw error;
  }
}
