"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_rsc_src_lib_utils_hash_ts";
exports.ids = ["_rsc_src_lib_utils_hash_ts"];
exports.modules = {

/***/ "(rsc)/./src/lib/utils/hash.ts":
/*!*******************************!*\
  !*** ./src/lib/utils/hash.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   generateOrderNo: () => (/* binding */ generateOrderNo),\n/* harmony export */   getSnowId: () => (/* binding */ getSnowId),\n/* harmony export */   getUuid: () => (/* binding */ getUuid)\n/* harmony export */ });\n/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! uuid */ \"(rsc)/./node_modules/uuid/dist/esm/v4.js\");\n\nfunction getUuid() {\n    return (0,uuid__WEBPACK_IMPORTED_MODULE_0__[\"default\"])();\n}\nfunction getSnowId() {\n    // 简化的雪花ID生成器\n    // 时间戳(42位) + 机器ID(10位) + 序列号(12位)\n    const timestamp = Date.now();\n    const machineId = Math.floor(Math.random() * 1024); // 0-1023\n    const sequence = Math.floor(Math.random() * 4096); // 0-4095\n    return `${timestamp}${machineId.toString().padStart(4, '0')}${sequence.toString().padStart(4, '0')}`;\n}\nfunction generateOrderNo() {\n    return getSnowId();\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3V0aWxzL2hhc2gudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFvQztBQUU3QixTQUFTRTtJQUNkLE9BQU9ELGdEQUFNQTtBQUNmO0FBRU8sU0FBU0U7SUFDZCxhQUFhO0lBQ2Isa0NBQWtDO0lBQ2xDLE1BQU1DLFlBQVlDLEtBQUtDLEdBQUc7SUFDMUIsTUFBTUMsWUFBWUMsS0FBS0MsS0FBSyxDQUFDRCxLQUFLRSxNQUFNLEtBQUssT0FBTyxTQUFTO0lBQzdELE1BQU1DLFdBQVdILEtBQUtDLEtBQUssQ0FBQ0QsS0FBS0UsTUFBTSxLQUFLLE9BQU8sU0FBUztJQUU1RCxPQUFPLEdBQUdOLFlBQVlHLFVBQVVLLFFBQVEsR0FBR0MsUUFBUSxDQUFDLEdBQUcsT0FBT0YsU0FBU0MsUUFBUSxHQUFHQyxRQUFRLENBQUMsR0FBRyxNQUFNO0FBQ3RHO0FBRU8sU0FBU0M7SUFDZCxPQUFPWDtBQUNUIiwic291cmNlcyI6WyIvVXNlcnMvdHV0dS9EZXNrdG9wL0JlIGEgRGV2ZWxvcGVyL215LWFpLXRvb2wtcHJvamVjdC9zcmMvbGliL3V0aWxzL2hhc2gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVdWlkKCk6IHN0cmluZyB7XG4gIHJldHVybiB1dWlkdjQoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNub3dJZCgpOiBzdHJpbmcge1xuICAvLyDnroDljJbnmoTpm6roirFJROeUn+aIkOWZqFxuICAvLyDml7bpl7TmiLMoNDLkvY0pICsg5py65ZmoSUQoMTDkvY0pICsg5bqP5YiX5Y+3KDEy5L2NKVxuICBjb25zdCB0aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuICBjb25zdCBtYWNoaW5lSWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDI0KTsgLy8gMC0xMDIzXG4gIGNvbnN0IHNlcXVlbmNlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNDA5Nik7IC8vIDAtNDA5NVxuICBcbiAgcmV0dXJuIGAke3RpbWVzdGFtcH0ke21hY2hpbmVJZC50b1N0cmluZygpLnBhZFN0YXJ0KDQsICcwJyl9JHtzZXF1ZW5jZS50b1N0cmluZygpLnBhZFN0YXJ0KDQsICcwJyl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlT3JkZXJObygpOiBzdHJpbmcge1xuICByZXR1cm4gZ2V0U25vd0lkKCk7XG59ICJdLCJuYW1lcyI6WyJ2NCIsInV1aWR2NCIsImdldFV1aWQiLCJnZXRTbm93SWQiLCJ0aW1lc3RhbXAiLCJEYXRlIiwibm93IiwibWFjaGluZUlkIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwic2VxdWVuY2UiLCJ0b1N0cmluZyIsInBhZFN0YXJ0IiwiZ2VuZXJhdGVPcmRlck5vIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/utils/hash.ts\n");

/***/ })

};
;