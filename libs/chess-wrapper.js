// Wrapper to make chess.js ESM module work in browser
(async function() {
  const chessModule = await import(chrome.runtime.getURL('libs/chess-esm.js'));
  window.Chess = chessModule.Chess;
  window.ChessConstants = {
    WHITE: chessModule.WHITE,
    BLACK: chessModule.BLACK,
    PAWN: chessModule.PAWN,
    KNIGHT: chessModule.KNIGHT,
    BISHOP: chessModule.BISHOP,
    ROOK: chessModule.ROOK,
    QUEEN: chessModule.QUEEN,
    KING: chessModule.KING
  };
})();

