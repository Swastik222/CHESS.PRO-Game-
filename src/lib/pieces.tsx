import React from "react";
import { PieceStyle } from "../types";

export const getCustomPieces = (pieceStyle: PieceStyle) => {
  if (pieceStyle === "classic") return undefined; // Use default pieces

  const pieces = ["wP", "wN", "wB", "wR", "wQ", "wK", "bP", "bN", "bB", "bR", "bQ", "bK"];
  const customPieces: Record<string, () => React.JSX.Element> = {};

  pieces.forEach((piece) => {
    customPieces[piece] = () => (
      <img
        src={`https://lichess1.org/assets/piece/${pieceStyle}/${piece}.svg`}
        alt={piece}
        style={{ width: "100%", height: "100%" }}
      />
    );
  });

  return customPieces;
};
