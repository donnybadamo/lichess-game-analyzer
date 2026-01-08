/**
 * Example Game Commentary Script
 * Default demo game for Chess Commentator showcase
 * Game: IIOhManII vs zinoukorrichi (Lichess Blitz, Polish Opening)
 * 
 * POV: Narrating IIOhManII's game (White) - "you" = IIOhManII
 */

const MoveQuality = {
  BRILLIANT: 'brilliant',
  GREAT: 'great',
  BEST: 'best',
  GOOD: 'good',
  BOOK: 'book',
  INACCURACY: 'inaccuracy',
  MISTAKE: 'mistake',
  BLUNDER: 'blunder',
  MISS: 'miss'
};

const EXAMPLE_GAME_COMMENTARY = {
  meta: {
    white: "IIOhManII",
    black: "zinoukorrichi",
    whiteElo: 1793,
    blackElo: 1805,
    opening: "Polish Opening: Schiffler-Sokolsky Variation",
    result: "1-0",
    site: "lichess.org",
    timeControl: "3+2 Blitz",
    url: "https://lichess.org/V2Y1nkCJ",
    protagonist: "white"
  },

  intro: `Alright, let's break down your blitz game against zinoukorrichi. You went with the Polish Opening — b4, the Orangutan. Bold choice, I respect it. Your opponent's rated slightly higher at 1805, but spoiler alert: this game is gonna be a wild ride. Let's see how you handled it.`,

  moves: [
    {
      moveNumber: 1,
      white: {
        san: "b4",
        commentary: "You open with b4 — the Polish! Also called the Orangutan. Right out the gate you're saying 'I don't play normal chess.' Love the energy.",
        eval: -0.07,
        quality: MoveQuality.BOOK,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Nf6",
        commentary: "They respond with Knight f6. Most popular reply.",
        eval: -0.11,
        quality: MoveQuality.BOOK,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 2,
      white: {
        san: "Bb2",
        commentary: "You fianchetto with Bishop b2. Classic Polish setup — that bishop controls the long diagonal all game.",
        eval: -0.10,
        quality: MoveQuality.BOOK,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "e6",
        commentary: "They play e6, keeping it solid.",
        eval: -0.03,
        quality: MoveQuality.BOOK,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 3,
      white: {
        san: "b5",
        commentary: "You push b5! Grabbing queenside space. Aggressive.",
        eval: -0.09,
        quality: MoveQuality.BOOK,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "d5",
        commentary: "They strike back with d5. Fighting for the center.",
        eval: -0.07,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 4,
      white: {
        san: "e3",
        commentary: "e3 — now you're in the Schiffler-Sokolsky Variation. The Polish has real theory and you know it.",
        eval: -0.03,
        quality: MoveQuality.BOOK,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Bd6",
        commentary: "They develop the bishop to d6.",
        eval: 0.00,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 5,
      white: {
        san: "Nf3",
        commentary: "Knight f3 — textbook. Controlling e5, ready to castle. This is the best move here.",
        eval: -0.04,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "O-O",
        commentary: "They castle kingside.",
        eval: -0.04,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 6,
      white: {
        san: "c4",
        commentary: "c4! Great move — you're striking at the center. Ambitious, aggressive play. This is how you put pressure on.",
        eval: -0.13,
        quality: MoveQuality.GREAT,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "a6",
        commentary: "They poke your b5 pawn.",
        eval: -0.15,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 7,
      white: {
        san: "a4",
        commentary: "a4, holding your queenside space. Solid.",
        eval: -0.06,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "c6",
        commentary: "They challenge your pawn chain with c6.",
        eval: 0.00,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 8,
      white: {
        san: "Be2",
        commentary: "Bishop e2 — getting ready to castle. Practical chess.",
        eval: -0.05,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "cxb5",
        commentary: "They take on b5. Stockfish preferred Nbd7 — small gift for you.",
        eval: 0.25,
        quality: MoveQuality.INACCURACY,
        bestMove: "Nbd7", bestMoveUci: "b8d7",
        suggestionComment: "Nbd7 was more accurate — develops while keeping tension."
      }
    },
    {
      moveNumber: 9,
      white: {
        san: "cxb5",
        commentary: "You recapture. axb5 was slightly better but this is fine.",
        eval: -0.15,
        quality: MoveQuality.GOOD,
        bestMove: "axb5", bestMoveUci: "a4b5",
        suggestionComment: "axb5 keeps a more flexible structure."
      },
      black: {
        san: "axb5",
        commentary: "They take back. a-file is now open.",
        eval: -0.17,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 10,
      white: {
        san: "Bxb5",
        commentary: "You snag the pawn with the bishop. Best move — nice active piece now.",
        eval: -0.17,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Bd7",
        commentary: "They challenge your bishop.",
        eval: -0.13,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 11,
      white: {
        san: "Nc3",
        commentary: "Knight c3, solid development.",
        eval: -0.11,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Nc6",
        commentary: "They finish development.",
        eval: -0.11,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 12,
      white: {
        san: "O-O",
        commentary: "You castle. King safe, rooks connected. Good stuff.",
        eval: -0.20,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Ne5",
        commentary: "They hop into e5 with tempo on your knight.",
        eval: -0.03,
        quality: MoveQuality.GREAT,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 13,
      white: {
        san: "Nxe5",
        commentary: "You trade knights. Reasonable decision.",
        eval: 0.00,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Bxe5",
        commentary: "They recapture. Strong central bishop.",
        eval: -0.06,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 14,
      white: {
        san: "f4",
        commentary: "f4!? Going aggressive, kicking the bishop. Risky but spicy. I like the fighting spirit.",
        eval: -0.08,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Bxb5",
        commentary: "They take your bishop. Critical moment coming...",
        eval: -0.09,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 15,
      white: {
        san: "fxe5",
        commentary: "Ooof. fxe5?? This hurts. You needed axb5 to save your rook. Now they grab it for free. Down the exchange.",
        eval: -2.00,
        quality: MoveQuality.BLUNDER,
        bestMove: "axb5", bestMoveUci: "a4b5",
        suggestionComment: "axb5 saves the rook! The bishop is hanging. After fxe5, Black takes on f1.",
        isKeyMoment: true, keyMomentType: "blunder", keyMomentTitle: "Exchange Blunder"
      },
      black: {
        san: "Bxf1",
        commentary: "They take the rook. Minus 2. But this game isn't over.",
        eval: -2.00,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 16,
      white: {
        san: "exf6",
        commentary: "You push exf6. Best move — creating chaos is your only shot now.",
        eval: -1.93,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Bd3",
        commentary: "Bd3. Actually Bxc3 was better — they're letting you off easy.",
        eval: -1.67,
        quality: MoveQuality.INACCURACY,
        bestMove: "Bxc3", bestMoveUci: "f1c3",
        suggestionComment: "Bxc3 wins more material."
      }
    },
    {
      moveNumber: 17,
      white: {
        san: "fxg7",
        commentary: "fxg7! Great move — that pawn is a MONSTER now. Sitting on g7, staring at their king. This is your compensation.",
        eval: -2.07,
        quality: MoveQuality.GREAT,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Re8",
        commentary: "Re8. Kxg7 was simpler for them — another miss.",
        eval: -2.04,
        quality: MoveQuality.INACCURACY,
        bestMove: "Kxg7", bestMoveUci: "g8g7",
        suggestionComment: "Kxg7 eliminates the dangerous pawn."
      }
    },
    {
      moveNumber: 18,
      white: {
        san: "Qh5",
        commentary: "Queen h5 — getting aggressive! Down material but creating threats. Qf3 was a bit more accurate, but this is scary too.",
        eval: -2.48,
        quality: MoveQuality.INACCURACY,
        bestMove: "Qf3", bestMoveUci: "d1f3",
        suggestionComment: "Qf3 was more coordinated."
      },
      black: {
        san: "Qf6",
        commentary: "They defend with Qf6.",
        eval: -2.14,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 19,
      white: {
        san: "Ra2",
        commentary: "Ra2?? This is a blunder — you just allowed mate in one with Qf1. BUT... watch what happens next.",
        eval: -9999, evalDisplay: "#-1",
        quality: MoveQuality.BLUNDER,
        bestMove: "h3", bestMoveUci: "h2h3",
        suggestionComment: "h3 creates luft. Ra2 allows Qf1 checkmate!",
        isKeyMoment: true, keyMomentType: "blunder", keyMomentTitle: "Allows Mate in 1!"
      },
      black: {
        san: "Qg6",
        commentary: "WAIT. They played Qg6?? THEY MISSED IT! Qf1 was CHECKMATE! You just got the luckiest break of your chess career! Chess gods smiling on you today.",
        eval: -2.42,
        quality: MoveQuality.MISS,
        bestMove: "Qf1#", bestMoveUci: "f6f1",
        suggestionComment: "Qf1# was CHECKMATE. They missed it!",
        isKeyMoment: true, keyMomentType: "missedMate", keyMomentTitle: "OPPONENT MISSES MATE!",
        highlightSquares: ["f1"]
      }
    },
    {
      moveNumber: 20,
      white: {
        san: "Qf3",
        commentary: "Queen f3. Best move — you're ALIVE. Momentum is all yours now.",
        eval: -3.09,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "e5",
        commentary: "e5. Not the best — you can feel them tilting.",
        eval: -2.70,
        quality: MoveQuality.INACCURACY,
        bestMove: "Rac8", bestMoveUci: "a8c8",
        suggestionComment: "Rac8 was stronger."
      }
    },
    {
      moveNumber: 21,
      white: {
        san: "Nxd5",
        commentary: "You grab d5. Ra1 was technically better but you're hunting now.",
        eval: -4.07,
        quality: MoveQuality.INACCURACY,
        bestMove: "Ra1", bestMoveUci: "a2a1",
        suggestionComment: "Ra1 improves the rook first."
      },
      black: {
        san: "Kxg7",
        commentary: "Kxg7?? THEY BLUNDERED AGAIN! Ra6 kept them winning. Now it's basically EQUAL. The tilt is REAL.",
        eval: 0.34,
        quality: MoveQuality.BLUNDER,
        bestMove: "Ra6", bestMoveUci: "a8a6",
        suggestionComment: "Ra6 keeps Black winning. They cracked.",
        isKeyMoment: true, keyMomentType: "blunder", keyMomentTitle: "Opponent Tilts!"
      }
    },
    {
      moveNumber: 22,
      white: {
        san: "Nf4",
        commentary: "Knight f4! Great move — beautiful square. Your pieces are humming now.",
        eval: 0.44,
        quality: MoveQuality.GREAT,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Qc6",
        commentary: "Qc6?? They COLLAPSE. Be4 was the only way to fight. You're winning now! Plus 5!",
        eval: 4.90,
        quality: MoveQuality.BLUNDER,
        bestMove: "Be4", bestMoveUci: "d3e4",
        suggestionComment: "Be4 was the only move. They're mentally done.",
        isKeyMoment: true, keyMomentType: "blunder", keyMomentTitle: "Opponent Collapses"
      }
    },
    {
      moveNumber: 23,
      white: {
        san: "Qxc6",
        commentary: "You trade queens. Best move — up a piece in the endgame now. Clean conversion.",
        eval: 4.82,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "bxc6",
        commentary: "Forced recapture.",
        eval: 4.69,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 24,
      white: {
        san: "Nxd3",
        commentary: "You scoop up the bishop. Best move — cleaning house.",
        eval: 4.74,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Red8",
        commentary: "They try to fight. It's over.",
        eval: 5.09,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 25,
      white: {
        san: "Nxe5",
        commentary: "Knight takes e5. Best move — feasting on pawns.",
        eval: 5.04,
        quality: MoveQuality.BEST,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      },
      black: {
        san: "Rxd2",
        commentary: "They grab a pawn. Doesn't matter.",
        eval: 4.91,
        quality: MoveQuality.GOOD,
        bestMove: null, bestMoveUci: null, suggestionComment: null
      }
    },
    {
      moveNumber: 26,
      white: {
        san: "Nc4+",
        commentary: "Knight c4 CHECK! Brilliant finish — forking king and rook. They resign. WHAT A COMEBACK!",
        eval: 5.08,
        quality: MoveQuality.BRILLIANT,
        bestMove: null, bestMoveUci: null, suggestionComment: null,
        isKeyMoment: true, keyMomentType: "brilliant", keyMomentTitle: "Brilliant Finish!"
      },
      black: null
    }
  ],

  outro: `WHAT. A. GAME. You blundered the exchange, then blundered MATE IN ONE — but your opponent missed it! From there, you had all the momentum. They tilted, blundered three more times, and you pulled off an incredible comeback.

Never give up. And when you're winning? Slow down and look for checks. Your opponent learned that the hard way.

GG — incredible mental fortitude. That's a game you remember forever.`,

  // Key moments showcasing ALL move quality types for demo
  keyMoments: [
    // === YOUR OPENING ===
    { moveNumber: 1, side: "white", ply: 0, type: "opening", quality: MoveQuality.BOOK,
      title: "Bold Opening Choice", eval: -0.07,
      description: "You open with the Polish — setting the tone" },
    
    // === YOUR GREAT MOVES ===
    { moveNumber: 6, side: "white", ply: 10, type: "great", quality: MoveQuality.GREAT,
      title: "Ambitious Play!", eval: -0.13,
      description: "c4! — striking at the center" },
    
    // === YOUR BEST MOVES ===
    { moveNumber: 5, side: "white", ply: 8, type: "best", quality: MoveQuality.BEST,
      title: "Textbook Development", eval: -0.04,
      description: "Nf3 — controlling e5, preparing to castle" },
    { moveNumber: 10, side: "white", ply: 18, type: "best", quality: MoveQuality.BEST,
      title: "Optimal Piece Activity", eval: -0.17,
      description: "Bxb5 — best move, active bishop" },
    
    // === YOUR GOOD MOVES ===
    { moveNumber: 12, side: "white", ply: 22, type: "good", quality: MoveQuality.GOOD,
      title: "King Safety", eval: -0.20,
      description: "O-O — castled, rooks connected" },
    
    // === YOUR INACCURACIES ===
    { moveNumber: 18, side: "white", ply: 34, type: "inaccuracy", quality: MoveQuality.INACCURACY,
      title: "Slight Inaccuracy", eval: -2.48, bestMove: "Qf3", bestMoveUci: "d1f3",
      description: "Qh5?! — Qf3 was more accurate" },
    
    // === YOUR BLUNDERS ===
    { moveNumber: 15, side: "white", ply: 28, type: "blunder", quality: MoveQuality.BLUNDER,
      title: "Exchange Blunder", eval: -2.00, bestMove: "axb5", bestMoveUci: "a4b5",
      description: "fxe5?? — should've saved the rook with axb5" },
    { moveNumber: 19, side: "white", ply: 36, type: "blunder", quality: MoveQuality.BLUNDER,
      title: "You Allow Mate in 1!", eval: "#-1", bestMove: "h3", bestMoveUci: "h2h3",
      description: "Ra2?? — but watch what happens..." },
    
    // === THE TURNING POINT ===
    { moveNumber: 19, side: "black", ply: 37, type: "missedMate", quality: MoveQuality.MISS,
      title: "OPPONENT MISSES MATE!", eval: -2.42, bestMove: "Qf1#", bestMoveUci: "f6f1",
      description: "They missed Qf1# — your lucky break!" },
    
    // === YOUR COMEBACK MOVES ===
    { moveNumber: 17, side: "white", ply: 32, type: "great", quality: MoveQuality.GREAT,
      title: "Creating Chaos", eval: -2.07,
      description: "fxg7! — monster pawn threatening promotion" },
    { moveNumber: 22, side: "white", ply: 42, type: "great", quality: MoveQuality.GREAT,
      title: "Beautiful Placement", eval: 0.44,
      description: "Nf4! — your pieces come alive" },
    { moveNumber: 23, side: "white", ply: 44, type: "best", quality: MoveQuality.BEST,
      title: "Clean Conversion", eval: 4.82,
      description: "Qxc6 — simplifying into a won endgame" },
    
    // === OPPONENT COLLAPSE ===
    { moveNumber: 21, side: "black", ply: 41, type: "blunder", quality: MoveQuality.BLUNDER,
      title: "Opponent Tilts", eval: 0.34, bestMove: "Ra6", bestMoveUci: "a8a6",
      description: "Kxg7?? — they crack under pressure" },
    { moveNumber: 22, side: "black", ply: 43, type: "blunder", quality: MoveQuality.BLUNDER,
      title: "Opponent Collapses", eval: 4.90, bestMove: "Be4", bestMoveUci: "d3e4",
      description: "Qc6?? — full mental collapse" },
    
    // === BRILLIANT FINISH ===
    { moveNumber: 26, side: "white", ply: 50, type: "brilliant", quality: MoveQuality.BRILLIANT,
      title: "Brilliant Finish!", eval: 5.08,
      description: "Nc4+!! — fork wins, they resign. GG!" }
  ],

  stats: {}
};

// Calculate stats
(function() {
  const dominated = ['brilliant', 'great', 'best', 'good', 'book'];
  let w = { dominated: 0, brilliant: 0, great: 0, best: 0, good: 0, book: 0, inac: 0, mistake: 0, blunder: 0 };
  let b = { dominated: 0, inac: 0, mistake: 0, blunder: 0, miss: 0 };
  EXAMPLE_GAME_COMMENTARY.moves.forEach(m => {
    if (m.white) {
      if (dominated.includes(m.white.quality)) w.dominated++;
      if (m.white.quality === 'brilliant') w.brilliant++;
      if (m.white.quality === 'great') w.great++;
      if (m.white.quality === 'best') w.best++;
      if (m.white.quality === 'good') w.good++;
      if (m.white.quality === 'book') w.book++;
      if (m.white.quality === 'inaccuracy') w.inac++;
      if (m.white.quality === 'mistake') w.mistake++;
      if (m.white.quality === 'blunder') w.blunder++;
    }
    if (m.black) {
      if (dominated.includes(m.black.quality)) b.dominated++;
      if (m.black.quality === 'inaccuracy') b.inac++;
      if (m.black.quality === 'mistake') b.mistake++;
      if (m.black.quality === 'blunder') b.blunder++;
      if (m.black.quality === 'miss') b.miss++;
    }
  });
  EXAMPLE_GAME_COMMENTARY.stats = {
    white: { 
      dominated: w.dominated, 
      brilliant: w.brilliant, 
      great: w.great,
      best: w.best,
      good: w.good,
      book: w.book,
      inaccuracies: w.inac, 
      mistakes: w.mistake, 
      blunders: w.blunder 
    },
    black: { 
      dominated: b.dominated, 
      inaccuracies: b.inac, 
      mistakes: b.mistake, 
      blunders: b.blunder, 
      missedWins: b.miss 
    }
  };
})();

// ============ HELPER FUNCTIONS ============

function getMoveByPly(ply) {
  const moveIdx = Math.floor(ply / 2);
  const isWhite = ply % 2 === 0;
  const m = EXAMPLE_GAME_COMMENTARY.moves[moveIdx];
  if (!m) return null;
  
  const moveData = isWhite ? m.white : m.black;
  if (!moveData) return null;
  
  // Add move index and ply for compatibility
  return {
    ...moveData,
    moveIndex: ply,
    ply: ply
  };
}

function isKeyMoment(ply) { 
  const moveData = getMoveByPly(ply);
  return moveData?.isKeyMoment || false; 
}

function getBestMoveArrow(ply) {
  const m = getMoveByPly(ply);
  if (!m?.bestMoveUci) return null;
  const colors = { blunder: '#ff4444', miss: '#ff4444', mistake: '#ff8800', inaccuracy: '#ffcc00' };
  return {
    from: m.bestMoveUci.substring(0, 2),
    to: m.bestMoveUci.substring(2, 4),
    color: colors[m.quality] || '#ffaa00',
    san: m.bestMove,
    comment: m.suggestionComment
  };
}

function getQualityIcon(q) {
  return { brilliant: '!!', great: '!', best: '★', good: '✓', book: '📖', inaccuracy: '?!', mistake: '?', blunder: '??', miss: '✗' }[q] || '';
}

function getQualityColor(q) {
  return { brilliant: '#26c6da', great: '#66bb6a', best: '#81c784', good: '#a5d6a7', book: '#90a4ae', inaccuracy: '#ffca28', mistake: '#ffa726', blunder: '#ef5350', miss: '#e53935' }[q] || '#fff';
}

function getBoardDisplayData(ply) {
  const m = getMoveByPly(ply);
  if (!m) return null;
  return {
    san: m.san, 
    commentary: m.commentary, 
    eval: m.evalDisplay || m.eval,
    quality: m.quality, 
    qualityIcon: getQualityIcon(m.quality), 
    qualityColor: getQualityColor(m.quality),
    bestMove: m.bestMove ? { 
      san: m.bestMove, 
      uci: m.bestMoveUci, 
      from: m.bestMoveUci?.substring(0,2), 
      to: m.bestMoveUci?.substring(2,4), 
      comment: m.suggestionComment 
    } : null,
    isKeyMoment: m.isKeyMoment || false, 
    keyMomentType: m.keyMomentType, 
    keyMomentTitle: m.keyMomentTitle,
    highlightSquares: m.highlightSquares || []
  };
}

// Get key moment by index for scrubber/timeline
function getKeyMoment(index) {
  return EXAMPLE_GAME_COMMENTARY.keyMoments[index] || null;
}

// Get all key moments of a specific type
function getKeyMomentsByType(type) {
  return EXAMPLE_GAME_COMMENTARY.keyMoments.filter(km => km.type === type);
}

// Get all key moments for a specific side
function getKeyMomentsBySide(side) {
  return EXAMPLE_GAME_COMMENTARY.keyMoments.filter(km => km.side === side);
}

// Export for use in analysis scripts
if (typeof window !== 'undefined') {
  window.EXAMPLE_GAME_COMMENTARY = EXAMPLE_GAME_COMMENTARY;
  window.MoveQuality = MoveQuality;
  window.getMoveByPly = getMoveByPly;
  window.isKeyMoment = isKeyMoment;
  window.getBestMoveArrow = getBestMoveArrow;
  window.getBoardDisplayData = getBoardDisplayData;
  window.getQualityIcon = getQualityIcon;
  window.getQualityColor = getQualityColor;
  window.getKeyMoment = getKeyMoment;
  window.getKeyMomentsByType = getKeyMomentsByType;
  window.getKeyMomentsBySide = getKeyMomentsBySide;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    EXAMPLE_GAME_COMMENTARY, 
    MoveQuality, 
    getMoveByPly, 
    isKeyMoment, 
    getBestMoveArrow, 
    getBoardDisplayData, 
    getQualityIcon, 
    getQualityColor,
    getKeyMoment,
    getKeyMomentsByType,
    getKeyMomentsBySide
  };
}
