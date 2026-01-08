/**
 * Example Game Commentary Script
 * Default demo game for Chess Commentator showcase
 * Game: IIOhManII vs zinoukorrichi (Lichess Blitz, Polish Opening)
 * 
 * Features:
 * - Commentary for every move
 * - Best move suggestions with arrows/highlights for board display
 * - Eval scores from Lichess analysis
 * - Key moment flags for scrubber
 */

const EXAMPLE_GAME_COMMENTARY = {
  // Game metadata
  meta: {
    white: "IIOhManII",
    black: "zinoukorrichi",
    whiteElo: 1793,
    blackElo: 1805,
    opening: "Polish Opening: Schiffler-Sokolsky Variation",
    result: "1-0",
    site: "lichess.org",
    timeControl: "3+2 Blitz",
    url: "https://lichess.org/V2Y1nkCJ"
  },

  // Intro played when game loads
  intro: `Alright, let's break down this blitz brawl. We've got IIOhManII on the white pieces against zinoukorrichi — both around 1800, so expect some fireworks. White's going with the Polish Opening — that's 1.b4, the Orangutan. Bold choice. Let's see how this chaos unfolds.`,

  // Full move list with analysis
  // Each move contains: played move, commentary, eval, bestMove (if different), annotation
  moves: [
    // === MOVE 1 ===
    {
      moveNumber: 1,
      white: {
        san: "b4",
        commentary: "And we're off with b4 — the Polish Opening! Also called the Orangutan or the Sokolsky. White's immediately saying 'I don't play normal chess.' Respect.",
        eval: -0.07,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Nf6",
        commentary: "Knight f6, the most popular response. Solid development, controls e4, and doesn't commit to a pawn structure yet.",
        eval: -0.11,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 2 ===
    {
      moveNumber: 2,
      white: {
        san: "Bb2",
        commentary: "Bishop b2, fianchettoing on the long diagonal. Classic Polish setup — that bishop is gonna stare down the board at g7.",
        eval: -0.10,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "e6",
        commentary: "e6, solid and flexible. Black's preparing to develop the dark-squared bishop and keeping options open.",
        eval: -0.03,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 3 ===
    {
      moveNumber: 3,
      white: {
        san: "b5",
        commentary: "b5! Pushing the pawn forward, grabbing space on the queenside. Aggressive stuff.",
        eval: -0.09,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "d5",
        commentary: "d5, striking back in the center. Classic response — don't let White have all the space.",
        eval: -0.07,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 4 ===
    {
      moveNumber: 4,
      white: {
        san: "e3",
        commentary: "e3 and we've officially entered the Schiffler-Sokolsky Variation. Yes, this is real opening theory. The Polish has been analyzed!",
        eval: -0.03,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Bd6",
        commentary: "Bishop d6, a natural developing move. The bishop eyes the kingside and supports a potential e5 push.",
        eval: 0.00,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 5 ===
    {
      moveNumber: 5,
      white: {
        san: "Nf3",
        commentary: "Knight f3, textbook development. Controls e5 and prepares castling.",
        eval: -0.04,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "O-O",
        commentary: "Black castles kingside. King safety first — smart in a sharp position like this.",
        eval: -0.04,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 6 ===
    {
      moveNumber: 6,
      white: {
        san: "c4",
        commentary: "c4! White's playing ambitiously, striking at the center and preparing to open lines on the queenside.",
        eval: -0.13,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "a6",
        commentary: "a6, poking at that b5 pawn. Black wants to challenge White's queenside space.",
        eval: -0.15,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 7 ===
    {
      moveNumber: 7,
      white: {
        san: "a4",
        commentary: "a4, supporting the b5 pawn. White's committed to holding that queenside space.",
        eval: -0.06,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "c6",
        commentary: "c6, attacking the b5 pawn chain. Black wants to break through and free up the position.",
        eval: 0.00,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 8 ===
    {
      moveNumber: 8,
      white: {
        san: "Be2",
        commentary: "Bishop e2, modest but preparing to castle. White's getting the king safe before the fireworks.",
        eval: -0.05,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "cxb5",
        commentary: "Black takes on b5! The pawn structure opens up. This creates some imbalances.",
        eval: 0.25,
        bestMove: "Nbd7",
        bestMoveUci: "b8d7",
        annotation: null,
        suggestionComment: "Stockfish slightly prefers developing with Nbd7 first, keeping more tension."
      }
    },

    // === MOVE 9 ===
    {
      moveNumber: 9,
      white: {
        san: "cxb5",
        commentary: "White recaptures. Now the c-file is half-open — could become important later.",
        eval: -0.15,
        bestMove: "axb5",
        bestMoveUci: "a4b5",
        annotation: null,
        suggestionComment: "axb5 was slightly more accurate, keeping pawn structure more flexible."
      },
      black: {
        san: "axb5",
        commentary: "Black takes back, and now the a-file is open. Rooks are gonna love that.",
        eval: -0.17,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 10 ===
    {
      moveNumber: 10,
      white: {
        san: "Bxb5",
        commentary: "Bishop takes b5, winning the pawn back. White's bishop is now actively placed.",
        eval: -0.17,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Bd7",
        commentary: "Bishop d7, developing and challenging White's active bishop. Good technique.",
        eval: -0.13,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 11 ===
    {
      moveNumber: 11,
      white: {
        san: "Nc3",
        commentary: "Knight c3, solid development. The knight supports the d5 square and eyes the center.",
        eval: -0.11,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Nc6",
        commentary: "Knight c6, getting the last minor piece out. Black's development is complete.",
        eval: -0.11,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 12 ===
    {
      moveNumber: 12,
      white: {
        san: "O-O",
        commentary: "White castles. Both kings are safe now. Time for the middlegame battle.",
        eval: -0.20,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Ne5",
        commentary: "Knight e5! Black's knight jumps into the center with tempo, attacking the f3 knight. Nice активность!",
        eval: -0.03,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 13 ===
    {
      moveNumber: 13,
      white: {
        san: "Nxe5",
        commentary: "White trades knights. Simplification in the center.",
        eval: 0.00,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Bxe5",
        commentary: "Bishop recaptures. Black's dark-squared bishop is now a monster in the center.",
        eval: -0.06,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 14 ===
    {
      moveNumber: 14,
      white: {
        san: "f4",
        commentary: "f4!? Aggressive — White wants to kick that bishop. But this weakens the king a bit...",
        eval: -0.08,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Bxb5",
        commentary: "Black snaps off the bishop! Now White has a decision to make about recapturing.",
        eval: -0.09,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 15 - THE BLUNDER ===
    {
      moveNumber: 15,
      white: {
        san: "fxe5",
        commentary: "OH NO. fxe5?? That's a BLUNDER! White should have played axb5 to save the rook on f1. Instead, Black gets to take a whole rook! This is minus 2 now — Black is winning.",
        eval: -2.00,
        bestMove: "axb5",
        bestMoveUci: "a4b5",
        annotation: "??",
        isKeyMoment: true,
        keyMomentType: "blunder",
        keyMomentTitle: "Exchange Blunder",
        suggestionComment: "axb5 saves the rook. After fxe5, Black wins the exchange with Bxf1."
      },
      black: {
        san: "Bxf1",
        commentary: "Bishop takes f1! Black grabs the rook. Up the exchange now — that's a big advantage.",
        eval: -2.00,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 16 ===
    {
      moveNumber: 16,
      white: {
        san: "exf6",
        commentary: "exf6, pushing the pawn. White's trying to create chaos to compensate for the lost material.",
        eval: -1.93,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Bd3",
        commentary: "Bishop d3, keeping the bishop active and preventing White from easily coordinating.",
        eval: -1.67,
        bestMove: "Bxc3",
        bestMoveUci: "f1c3",
        annotation: null,
        suggestionComment: "Bxc3 was even stronger, winning more material."
      }
    },

    // === MOVE 17 ===
    {
      moveNumber: 17,
      white: {
        san: "fxg7",
        commentary: "fxg7! Now THAT pawn is a monster — sitting on g7, one square from promotion, staring at Black's king.",
        eval: -2.07,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Re8",
        commentary: "Rook e8, getting off the back rank and preparing to defend. Black needs to be careful with that g7 pawn.",
        eval: -2.04,
        bestMove: "Kxg7",
        bestMoveUci: "g8g7",
        annotation: null,
        suggestionComment: "Actually, Kxg7 was fine here — just take the pawn and simplify."
      }
    },

    // === MOVE 18 ===
    {
      moveNumber: 18,
      white: {
        san: "Qh5",
        commentary: "Queen h5, getting aggressive! White's down material but creating threats. That's blitz chess baby.",
        eval: -2.48,
        bestMove: "Qf3",
        bestMoveUci: "d1f3",
        annotation: null,
        suggestionComment: "Qf3 was more accurate, keeping better coordination."
      },
      black: {
        san: "Qf6",
        commentary: "Queen f6, defending and eyeing the g7 pawn. Solid defensive move... but wait for what's coming.",
        eval: -2.14,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 19 - THE DRAMA ===
    {
      moveNumber: 19,
      white: {
        san: "Ra2",
        commentary: "Ra2?? White moves the rook and... oh no. OH NO. White just allowed MATE IN ONE. This is a catastrophic blunder!",
        eval: "#-1",
        bestMove: "h3",
        bestMoveUci: "h2h3",
        annotation: "??",
        isKeyMoment: true,
        keyMomentType: "blunder",
        keyMomentTitle: "Allows Mate in 1!",
        suggestionComment: "h3 was necessary to create an escape square. Now Qf1 is checkmate!"
      },
      black: {
        san: "Qg6",
        commentary: "WAIT. WAIT WAIT WAIT. Qg6?? NO! NO NO NO! Black had MATE IN ONE! Queen f1 was CHECKMATE! The queen just goes to f1, and it's game over! Are you KIDDING me?! This is the miss of the century! Black had the game WON in one single move and just... didn't see it. Oh man. This is why we analyze our games, folks. This is gonna haunt zinoukorrichi forever.",
        eval: -2.42,
        bestMove: "Qf1#",
        bestMoveUci: "f6f1",
        annotation: "??",
        isKeyMoment: true,
        keyMomentType: "missedMate",
        keyMomentTitle: "MISSED MATE IN ONE!",
        suggestionComment: "Qf1# was CHECKMATE. The king has no escape squares and no pieces can block.",
        showBestMoveArrow: true,
        highlightSquares: ["f1"]
      }
    },

    // === MOVE 20 ===
    {
      moveNumber: 20,
      white: {
        san: "Qf3",
        commentary: "Queen f3. White survives! Still down material, but that missed mate changes everything psychologically. You can feel the momentum shifting.",
        eval: -3.09,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "e5",
        commentary: "e5, pushing the pawn. Black's trying to regroup but you know the tilt is setting in.",
        eval: -2.70,
        bestMove: "Rac8",
        bestMoveUci: "a8c8",
        annotation: null,
        suggestionComment: "Rac8 was stronger, activating the rook and keeping pressure."
      }
    },

    // === MOVE 21 ===
    {
      moveNumber: 21,
      white: {
        san: "Nxd5",
        commentary: "Knight takes d5 — an inaccuracy from White, but they're playing on pure adrenaline now.",
        eval: -4.07,
        bestMove: "Ra1",
        bestMoveUci: "a2a1",
        annotation: "?!",
        suggestionComment: "Ra1 was better, improving the rook before grabbing pawns."
      },
      black: {
        san: "Kxg7",
        commentary: "Kxg7?? And here's the tilt! Black takes the pawn but this is a BLUNDER. Should've played Ra6, keeping the advantage. Now it's basically EQUAL. From winning to even, just like that.",
        eval: 0.34,
        bestMove: "Ra6",
        bestMoveUci: "a8a6",
        annotation: "??",
        isKeyMoment: true,
        keyMomentType: "blunder",
        keyMomentTitle: "Tilt Blunder #1",
        suggestionComment: "Ra6 keeps Black winning. The rook lift creates threats and maintains coordination."
      }
    },

    // === MOVE 22 ===
    {
      moveNumber: 22,
      white: {
        san: "Nf4",
        commentary: "Knight f4! White's pieces are suddenly humming. The knight is beautifully placed.",
        eval: 0.44,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Qc6",
        commentary: "Qc6?? And Black just COLLAPSES. This is a disaster! The eval shoots from slightly worse to plus 5! Should've played Bishop e4 to stay in the game. The tilt after missing that mate is absolutely real.",
        eval: 4.90,
        bestMove: "Be4",
        bestMoveUci: "d3e4",
        annotation: "??",
        isKeyMoment: true,
        keyMomentType: "blunder",
        keyMomentTitle: "Tilt Blunder #2",
        suggestionComment: "Be4 was the only move to stay in the game. It blocks the queen and keeps the bishop active."
      }
    },

    // === MOVE 23 ===
    {
      moveNumber: 23,
      white: {
        san: "Qxc6",
        commentary: "Queens come off. White's up a full piece now heading into the endgame. This is over.",
        eval: 4.82,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "bxc6",
        commentary: "bxc6, forced recapture. Black's position is in ruins.",
        eval: 4.69,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 24 ===
    {
      moveNumber: 24,
      white: {
        san: "Nxd3",
        commentary: "Knight takes d3, scooping up the bishop. White's collecting material now.",
        eval: 4.74,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Red8",
        commentary: "Rook to d8, trying to create some activity. But it's too little, too late.",
        eval: 5.09,
        bestMove: "Rad8",
        bestMoveUci: "a8d8",
        annotation: null,
        suggestionComment: "Rad8 was marginally better, but the position is lost regardless."
      }
    },

    // === MOVE 25 ===
    {
      moveNumber: 25,
      white: {
        san: "Nxe5",
        commentary: "Knight takes e5! White's gobbling up everything. Plus 5 on the eval.",
        eval: 5.04,
        bestMove: null,
        annotation: null
      },
      black: {
        san: "Rxd2",
        commentary: "Rook takes d2, grabbing a pawn back. But White's just too far ahead.",
        eval: 4.91,
        bestMove: null,
        annotation: null
      }
    },

    // === MOVE 26 - FINALE ===
    {
      moveNumber: 26,
      white: {
        san: "Nc4+",
        commentary: "Knight c4 check! A nice fork to end it. And Black resigns. What. A. Game.",
        eval: 5.08,
        bestMove: null,
        annotation: null,
        isKeyMoment: true,
        keyMomentType: "resignation",
        keyMomentTitle: "Black Resigns"
      },
      black: null // Black resigned
    }
  ],

  // Outro summary
  outro: `What a WILD ride! This game had everything — a creative opening, a blundered exchange, and the most painful missed mate you'll ever see. Black had Queen f1 checkmate on move 19 and just... didn't play it. From that moment, the psychological damage was done. Black tilted, blundered twice more, and White completed an incredible comeback from down a whole rook.

The lesson here? Always look for checks, captures, and threats. ESPECIALLY checks that end the game. When you're winning, slow down. Take a breath. Look for forcing moves.

GG to both players. But man... that missed mate is gonna haunt zinoukorrichi for a while.`,

  // Key moments array for highlight reel / scrubber UI
  keyMoments: [
    { 
      moveNumber: 15, 
      side: "white", 
      ply: 29,
      type: "blunder", 
      title: "Exchange Blunder", 
      eval: -2.00,
      bestMove: "axb5",
      bestMoveUci: "a4b5",
      description: "fxe5?? loses the exchange"
    },
    { 
      moveNumber: 19, 
      side: "white", 
      ply: 37,
      type: "blunder", 
      title: "Allows Mate in 1", 
      eval: "#-1",
      bestMove: "h3",
      bestMoveUci: "h2h3",
      description: "Ra2?? allows Qf1#"
    },
    { 
      moveNumber: 19, 
      side: "black", 
      ply: 38,
      type: "missedMate", 
      title: "MISSED MATE IN ONE!", 
      eval: -2.42,
      bestMove: "Qf1#",
      bestMoveUci: "f6f1",
      description: "Qg6?? misses Qf1 checkmate"
    },
    { 
      moveNumber: 21, 
      side: "black", 
      ply: 42,
      type: "blunder", 
      title: "Tilt Blunder #1", 
      eval: 0.34,
      bestMove: "Ra6",
      bestMoveUci: "a8a6",
      description: "Kxg7?? throws away the advantage"
    },
    { 
      moveNumber: 22, 
      side: "black", 
      ply: 44,
      type: "blunder", 
      title: "Tilt Blunder #2", 
      eval: 4.90,
      bestMove: "Be4",
      bestMoveUci: "d3e4",
      description: "Qc6?? loses immediately"
    },
    { 
      moveNumber: 26, 
      side: "white", 
      ply: 51,
      type: "victory", 
      title: "Black Resigns", 
      eval: 5.08,
      description: "Nc4+ forces resignation"
    }
  ]
};

// Helper function to get move commentary by ply (half-move index, 0-based)
function getMoveByPly(ply) {
  const moveIndex = Math.floor(ply / 2);
  const isWhite = ply % 2 === 0;
  const moveData = EXAMPLE_GAME_COMMENTARY.moves[moveIndex];
  
  if (!moveData) return null;
  return isWhite ? moveData.white : moveData.black;
}

// Helper function to check if a ply is a key moment
function isKeyMoment(ply) {
  const move = getMoveByPly(ply);
  return move?.isKeyMoment || false;
}

// Helper function to get best move arrow data for board display
function getBestMoveArrow(ply) {
  const move = getMoveByPly(ply);
  if (!move?.bestMoveUci) return null;
  
  const from = move.bestMoveUci.substring(0, 2);
  const to = move.bestMoveUci.substring(2, 4);
  
  return {
    from,
    to,
    color: move.annotation === "??" ? "#ff4444" : "#ffaa00", // Red for blunder, orange for inaccuracy
    san: move.bestMove,
    comment: move.suggestionComment
  };
}

// Get all data needed for board display at a given ply
function getBoardDisplayData(ply) {
  const move = getMoveByPly(ply);
  if (!move) return null;
  
  return {
    san: move.san,
    commentary: move.commentary,
    eval: move.eval,
    annotation: move.annotation,
    bestMove: move.bestMove ? {
      san: move.bestMove,
      uci: move.bestMoveUci,
      from: move.bestMoveUci?.substring(0, 2),
      to: move.bestMoveUci?.substring(2, 4),
      comment: move.suggestionComment
    } : null,
    isKeyMoment: move.isKeyMoment || false,
    keyMomentType: move.keyMomentType || null,
    keyMomentTitle: move.keyMomentTitle || null,
    highlightSquares: move.highlightSquares || []
  };
}

// Export for use in analysis page
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    EXAMPLE_GAME_COMMENTARY, 
    getMoveByPly, 
    isKeyMoment, 
    getBestMoveArrow,
    getBoardDisplayData
  };
}

// Make available globally for web version
if (typeof window !== 'undefined') {
  window.EXAMPLE_GAME_COMMENTARY = EXAMPLE_GAME_COMMENTARY;
  window.getMoveByPly = getMoveByPly;
  window.isKeyMoment = isKeyMoment;
  window.getBestMoveArrow = getBestMoveArrow;
  window.getBoardDisplayData = getBoardDisplayData;
}
