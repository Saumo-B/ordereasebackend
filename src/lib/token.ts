let counter = 1;

export const makeToken = () => {
  if (counter > 9999) counter = 1; // reset after 9999
  const token = counter.toString().padStart(4, "0");
  counter++;
  return token;
};
