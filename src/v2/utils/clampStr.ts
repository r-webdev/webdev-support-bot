export const clampLength = (str: string, maxLength: number): string => {
  if (str.length > maxLength) {
    return `${str.slice(0, maxLength - 3)}...`;
  }
  return str;
};

export const clampLengthMiddle = (str: string, maxLength: number): string => {
  if (str.length > maxLength) {
    const firstHalf = str.slice(0, maxLength / 2 - 3);
    const secondHalf = str.slice(str.length - maxLength / 2);
    return `${firstHalf}...${secondHalf}`;
  }
  return str;
};
