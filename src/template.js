import Handlebars from 'handlebars';

const registerHelpers = () => {
  Handlebars.registerHelper('eq', (a, b) => a === b);

  Handlebars.registerHelper('join', (array, separator) => array.join(separator));
};

export default {
  registerHelpers
};
