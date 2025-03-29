import Handlebars from "handlebars";

const registerHelpers = () => {
  Handlebars.registerHelper("eq", (a, b) => a === b);

  Handlebars.registerHelper("join", (array, separator) => array.join(separator));

  Handlebars.registerHelper("getIcon", (type) => {
    switch (type) {
      case "email":
        return "mail-outline";
      case "phone":
        return "call-outline";
      case "github":
        return "logo-github";
      case "linkedin":
        return "logo-linkedin";
      case "location":
        return "location-outline";
      default:
        return "";
    }
  });

  Handlebars.registerHelper("lookup", (obj, field, subfield) => {
    if (!obj || !field) {
      return "";
    }

    if (subfield) {
      return obj[field][subfield];
    }

    return obj[field];
  });
};

export default {
  registerHelpers
};
