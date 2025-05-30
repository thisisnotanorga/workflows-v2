function checkJavaScriptSyntax(code) {
  try {
    new Function(code);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = { checkJavaScriptSyntax };
