/**
 * Mirrors apps/life-api/Features/Labels/DTOs/LabelDtos.cs (LabelDto).
 */
export interface LabelDto {
  id: string;
  name: string;
  colourHex: string;
}

export interface CreateLabelInput {
  name: string;
  colourHex: string;
}
