import Handlebars from "handlebars";

const registerHelpers = () => {
  Handlebars.registerHelper("eq", (a, b) => a === b);

  Handlebars.registerHelper("join", (array, separator) => array.join(separator));

  Handlebars.registerHelper("contactIcon", (type) => {
    switch (type) {
      case "email":
        return "fa-envelope";
      case "phone":
        return "fa-phone";
      case "github":
        return "fa-github";
      case "linkedin":
        return "fa-linkedin";
      default:
        return "";
    }
  });
};

export default {
  registerHelpers
};
