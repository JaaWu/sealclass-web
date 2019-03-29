(function (RongClass) {
  'use strict';

  /* 以下错误码都为当前应用自定义错误码 */
  var ErrorCode = {
    '-10000': 'NETWORK_UNAVAILABLE',
    /* IM 相关 */
    '-1000': 'IM_CONNECT_ERROR',
    '-1001': 'IM_TOKEN_ERROR',
    '-1002': 'UPLOAD_FILE_ERROR',

    /* RTC 相关 */
    '-2000': 'RTC_GET_MEDIA_ERROR',
    '-2001': 'RTC_GET_SCREENSHARE_ERROR'
    /* 以下两项都在 RTC SDK 内部定义 */
    // '-2001': 'RTC_JOIN_ERROR',
    // '-2002': 'RTC_PUBLISH_ERROR'
  };

  function formatErrorCode(code) {
    for (var key in code) {
      var value = code[key];
      code[value] = key;
    }
    return code;
  }

  ErrorCode = formatErrorCode(ErrorCode);
  RongClass.ErrorCode = ErrorCode;
})(window.RongClass);