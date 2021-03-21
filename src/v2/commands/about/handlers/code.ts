const sites = [
  `<https://codepen.io/> - ⚠ requires account`,
  'https://codesandbox.io/',
  '<https://repl.it/>',
  '<https://ideone.com/>',
  '<https://jsfiddle.net/>',
].join('\n');

export const code: [string, string] = [
  'code',
  `
It would be much easier to help you if we could see (parts) of your code!
Try reproducing your issue on one of these sites, save and then link it here:

${sites}

Sometimes trying to recreate a problem outside of your project already helps you tracking down the issue on your own.
`,
];
