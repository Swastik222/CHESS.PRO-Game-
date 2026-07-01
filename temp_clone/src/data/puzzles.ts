export interface Puzzle {
  id: string;
  fen: string;
  moves: string[]; // standard algebraic notation or UCI, UCI is easier: e2e4
  rating: number;
}

export const dailyPuzzles: Puzzle[] = [
  {
    id: "p1",
    fen: "q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17",
    moves: ["e8d7", "a2e6", "d7d8", "f7f8"],
    rating: 1760
  },
  {
    id: "p2",
    fen: "r1bqk2r/1ppp1ppp/p1n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 w kq - 4 6",
    moves: ["f3e5", "c6e5", "d2d4"],
    rating: 1200
  },
  {
    id: "p3",
    fen: "8/1p3pkp/p1p3p1/8/1qP2Q2/1P1R2PP/P4P1K/4r3 b - - 2 31",
    moves: ["b4e7", "f4d4", "e7f6"],
    rating: 1540
  },
  {
    id: "p4",
    fen: "5rk1/5pp1/7p/p1Q5/P7/1q5P/5PP1/2R3K1 b - - 0 30",
    moves: ["f8b8", "c5a5"],
    rating: 1400
  },
  {
    id: "p5",
    fen: "r3r1k1/pp3ppp/2p5/4n1q1/4P3/2P2B2/PP2QPPP/R3R1K1 w - - 0 17",
    moves: ["b2b3", "e5f3", "e2f3"],
    rating: 1250
  },
  {
    id: "p6",
    fen: "r2qk2r/1p2bppp/p1n1pn2/3p4/3P4/PQN1PB2/1P3PPP/R1B1K2R w KQkq - 1 12",
    moves: ["b3b7", "c6a5", "b7a8"],
    rating: 1680
  },
  {
    id: "p7",
    fen: "5rk1/ppp2ppp/4b3/8/1n6/3BPN2/PqP2PPP/3QK2R w K - 1 15",
    moves: ["a2a3", "b4d3", "d1d3"],
    rating: 1100
  },
  {
    id: "p8",
    fen: "rn1qr1k1/ppp2ppp/5n2/4p3/1b2P1b1/2NB1N2/PPPP2PP/R1BQ1RK1 w - - 4 9",
    moves: ["h2h3", "g4h5", "a2a3"],
    rating: 1050
  },
  {
    id: "p9",
    fen: "r3r1k1/ppp2p1p/3p1qp1/3P4/2PQ2b1/5P2/PP2B1PP/R2R2K1 b - - 0 16",
    moves: ["f6d4", "d1d4", "e8e2"],
    rating: 1320
  },
  {
    id: "p10",
    fen: "6k1/5ppp/8/8/8/8/1R3PPP/6K1 w - - 0 1",
    moves: ["b2b8"],
    rating: 800
  }
];
