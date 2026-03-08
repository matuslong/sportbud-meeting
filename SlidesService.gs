var QuizSlidesService = (function () {
  function createPresentation(parsedQuiz, spreadsheet) {
    var timestamp = Utilities.formatDate(
      parsedQuiz.generatedAt,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm'
    );

    var presentation = SlidesApp.create(
      QUIZ_CONFIG.PROJECT_NAME + ' - ' + parsedQuiz.sourceSheetName + ' - ' + timestamp
    );

    removeDefaultSlide(presentation);

    parsedQuiz.rounds.forEach(function (round) {
      addRoundSlides(presentation, round);
    });

    movePresentationToSpreadsheetFolder(presentation, spreadsheet);

    return presentation;
  }

  function addRoundSlides(presentation, round) {
    createSimpleSlide(presentation, round.title, 'Tematicky blok');

    round.questions.forEach(function (item, index) {
      createQuestionSlide(presentation, item, index + 1);
    });
    createQuestionSlide(presentation, round.bonusQuestion, round.questions.length + 1);

    createSimpleSlide(presentation, QUIZ_CONFIG.SLIDE_TEXT.ANSWERS_SECTION, 'Kolo ' + round.number);

    round.questions.forEach(function (item, index) {
      createAnswerSlide(presentation, item, index + 1);
    });
    createAnswerSlide(presentation, round.bonusQuestion, round.questions.length + 1);
  }

  function createSimpleSlide(presentation, title, subtitle) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    addTitleTextBox(slide, title);
    addBodyTextBox(slide, subtitle || '');
  }

  function createQuestionSlide(presentation, item, indexInRound) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    var title = (item.type === 'bonus' ? 'Bonus otazka' : 'Otazka') + ' ' + indexInRound;
    var body = '[Tema] ' + item.topicTitle + '\n\n' + item.question;

    addTitleTextBox(slide, title);
    addBodyTextBox(slide, body);
  }

  function createAnswerSlide(presentation, item, indexInRound) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    var title = (item.type === 'bonus' ? 'Bonus - odpoved' : 'Otazka + odpoved') + ' ' + indexInRound;
    var body =
      '[Tema] ' + item.topicTitle + '\n\n' +
      'Otazka: ' + item.question + '\n\n' +
      'Odpoved: ' + item.answer;

    addTitleTextBox(slide, title);
    addBodyTextBox(slide, body);
  }

  function addTitleTextBox(slide, text) {
    var shape = slide.insertTextBox(text || '', 40, 30, 880, 70);
    var textStyle = shape.getText().getTextStyle();
    textStyle.setBold(true).setFontSize(32);
  }

  function addBodyTextBox(slide, text) {
    var shape = slide.insertTextBox(text || '', 40, 130, 880, 380);
    shape.getText().getTextStyle().setFontSize(22);
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

  function removeDefaultSlide(presentation) {
    var slides = presentation.getSlides();
    if (slides.length > 0) {
      slides[0].remove();
    }
  }

  return {
    createPresentation: createPresentation
  };
})();
