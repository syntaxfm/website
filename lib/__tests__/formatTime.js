import formatTime from "../formatTime";

test("formatTime() ", () => {
  expect(formatTime(Date.now())).toBeFalsy();
});
