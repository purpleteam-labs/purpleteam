// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of PurpleTeam.

// PurpleTeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// PurpleTeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this PurpleTeam project. If not, see <https://www.gnu.org/licenses/>.

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
