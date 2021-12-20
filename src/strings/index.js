// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

const TesterUnavailable = (tester) => `No ${tester} testing available currently. The ${tester} Tester is currently in-active.`; // Should match orchestrator.
const TestPlanUnavailable = (tester) => `No test plan available for the ${tester} Tester. The ${tester} Tester is currently in-active.`; // Should match orchestrator.

const TesterFeedbackRoutePrefix = (m) => ({ sse: 'tester-feedback', lp: 'poll-tester-feedback' }[m]);

// Also used in the app tester.
const NowAsFileName = () => {
  const date = new Date();
  const padLeft = (num) => (num < 10 ? `0${num}` : `${num}`);
  return `${date.getFullYear()}-${padLeft(date.getMonth() + 1)}-${padLeft(date.getDate())}T${padLeft(date.getHours())}:${padLeft(date.getMinutes())}:${padLeft(date.getSeconds())}`;
};

module.exports = {
  TesterUnavailable,
  TestPlanUnavailable,
  TesterFeedbackRoutePrefix,
  NowAsFileName
};
