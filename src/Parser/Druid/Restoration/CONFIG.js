import React from 'react';

import { blazyb, sref } from 'MAINTAINERS';

import SPECS from 'common/SPECS';

import CombatLogParser from './CombatLogParser';
import CHANGELOG from './CHANGELOG';

export default {
  spec: SPECS.RESTORATION_DRUID,
  maintainers: [blazyb, sref],
  patchCompatibility: '7.3.5',
  description: (
    <div>
      Welcome to the Resto Druid analyzer! We hope you find these suggestions and statistics useful.<br /><br />

      If you want to learn more about Resto Druids, join the Druid community at the <a href="https://discord.gg/dreamgrove" target="_blank" rel="noopener noreferrer">Dreamgrove discord channel</a>. Remember to check the pins (ctrl-P while in #resto channel) for guides, FAQs, and gearing guidelines.
    </div>
  ),
  // exampleReport: '/report/72t9vbcAqdpVRfBQ/12-Mythic+Garothi+Worldbreaker+-+Kill+(6:15)/Maxweii',

  changelog: CHANGELOG,
  parser: CombatLogParser,
  path: __dirname, // used for generating a GitHub link directly to your spec
};
