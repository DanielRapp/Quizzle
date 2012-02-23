/*
Note: Most of this code was written between 1 and 4 am, and may thus not be of the highest quality.
*/

var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var player = models.player;

var Game = function ( numQuestions ) {
  this.correctArtistName = "";
  this.over = false;
  this.startTime = new Date().getTime();
  this.questions = [];
  var timesQuestionsHasBeenCreated = 0;

  var limitStringLength = function( str, maxStringLength ) {
    if (str.length > maxStringLength) {
      return str.substr(0, maxStringLength-1) + '…';
    }
    return str;
  };

  this.newQuestion = function( resultFromLastQuestion ) {
    timesQuestionsHasBeenCreated++;
    if (timesQuestionsHasBeenCreated > numQuestions) this.over = true;

    var albums = models.library.albums;
    var artistGuess = [];

    // Try to use an album that has a cover
    for (var i = 0; i < albums.length; i++) {
      var randAlbumIndex = Math.floor(Math.random() * albums.length);

      if (albums[randAlbumIndex].data.cover) {
        var album = albums[randAlbumIndex];

        this.correctArtistName = limitStringLength( album.data.artist.name, 20 );
        artistGuess.push( album.data.artist );
        break;
      }
    }

    if (resultFromLastQuestion !== undefined) {
      this.questions[this.questions.length - 1].correct = resultFromLastQuestion;
    }

    this.questions.push({
      cover: album.data.cover,
      uri: album.data.uri
    });

    document.getElementById('cover').style.backgroundImage =
      'url(' + album.data.cover + ')';

    // Get 3 more artist guesses
    artistGuessLoop:
      for (var i = 0; i < albums.length; i++) {
      var randAlbumIndex = Math.floor(Math.random() * albums.length);
      var artist = albums[randAlbumIndex].data.artist;

      // Some (probably locally imported) albums doesn't have an artist
      if (artist.name == "") continue artistGuessLoop;

      // Make sure that artist isn't already a guess
      for (var j = 0; j < artistGuess.length; j++) {
        if (artist.name == artistGuess[j].name) continue artistGuessLoop;
      }

      artistGuess.push( artist );
      if (artistGuess.length == 4) break;
    }

    // Add the artist names to the answer boxes
    var correctIndex = Math.floor( Math.random() * 4 );
    for (var i = correctIndex; i < correctIndex + 4; i++) {
      var name = artistGuess[(i - correctIndex) % 4].name;
      name = limitStringLength( name, 20 );

      document.getElementsByClassName('answer')[i % 4].innerHTML = name;
    }
  };
};

exports.init = function() {
  var startClassEls = document.getElementsByClassName('start');
  for (var i = 0; i < startClassEls.length; i++) {
    startClassEls[i].addEventListener('click', function() {
      var game = new Game( 9 );

      // Add event listeners to all answer buttons
      for (var i = 0; i < 4; i++) {
        // We can't use addEventListener because we want to override the previous listener
        document.getElementsByClassName('answer')[i].onclick = function(e) {
          game.newQuestion( this.innerText == game.correctArtistName );

          if (game.over) {
            document.getElementById('questions').style.display = 'none';
            document.getElementById('outro').style.display = 'block';

            for (var i = 0; i < 9; i++) {
              var cover = document.getElementsByClassName('cover')[i];
              cover.href = game.questions[i].uri;
              cover.style.backgroundImage = 'url(' + game.questions[i].cover + ')';
              cover.style.borderColor = (game.questions[i].correct) ? 'rgba(0,255,0,0.65)' : 'rgba(255,0,0,0.65)';
            }

            var time = ( new Date().getTime() - game.startTime );

            // Figure out how many correct answers there were
            var numCorrect = 0;
            for (var i = 0; i < game.questions.length; i++) {
              if (game.questions[i].correct) numCorrect++;
            }

            var score = 100 / Math.sqrt(Math.sqrt(time)) * numCorrect;

            // Round to one decimal
            score = Math.round( score * 10 ) / 10;

            var highscore = localStorage.getItem('highscore');
            if (highscore === undefined) localStorage.setItem('highscore', score);

            if (localStorage.getItem('highscore') < score) localStorage.setItem('highscore', score);

            document.getElementById('best').innerText = localStorage.getItem('highscore');
            document.getElementById('score').innerText = score;
          }
        };
      }

      document.getElementById('intro').style.display = 'none';
      document.getElementById('outro').style.display = 'none';
      document.getElementById('questions').style.display = 'block';

      game.newQuestion();
    });
  }
};
