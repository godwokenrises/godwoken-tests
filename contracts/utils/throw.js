const { expect } = require("chai");

const expectThrowsAsync = async (method, errMsgKeyWords, noErrMsgKeyWord) => {
  let error = null;
  try {
    await method();
  } catch (err) {
    error = err;
  }
  expect(error).to.be.an("Error");

  const expectIncludeKeyWord = (keyword) => {
    expect(`${error.message} ${error.error}`).to.include(keyword);
  };
  const expectExcludeKeyWord = (keyword) => {
    expect(`${error.message} ${error.error}`).to.not.include(keyword);
  };

  if (errMsgKeyWords) {
    if (Array.isArray(errMsgKeyWords)) {
      for (keyWord of errMsgKeyWords) {
        expectIncludeKeyWord(keyWord);
      }
    } else {
      expectIncludeKeyWord(errMsgKeyWords);
    }
  }

  if (noErrMsgKeyWord) {
    if (Array.isArray(noErrMsgKeyWord)) {
      for (keyWord of noErrMsgKeyWord) {
        expectExcludeKeyWord(keyWord);
      }
    } else {
      expectExcludeKeyWord(noErrMsgKeyWord);
    }
  }
};

module.exports = {
  expectThrowsAsync,
};
