import React from 'react';

import { Sharrq, Herusx } from 'MAINTAINERS';
import SPECS from 'common/SPECS';
import Warning from 'common/Alert/Warning';
import Wrapper from 'common/Wrapper';

import CombatLogParser from './CombatLogParser';
import CHANGELOG from './CHANGELOG';

export default {
  spec: SPECS.ARCANE_MAGE,
  maintainers: [Sharrq, Herusx],
  patchCompatibility: '7.3.5',
  description: (
    <Wrapper>
      Hello Everyone! We are always looking to improve the Arcane Mage Analyzers and Modules; so if you find any issues or if there is something missing that you would like to see added, please open an Issue on GitHub or send a message to Sharrq on Discord (Sharrq#7530) <br /> <br />
	    Additionally, if you need further assistance in improving your gameplay as an Arcane Mage, you can refer to the following resources:<br />
      <a href="https://discord.gg/0gLMHikX2aZ23VdA" target="_blank" rel="noopener noreferrer">Mage Class Discord</a> <br />
      <a href="https://discord.gg/UrczP9U" target="_blank" rel="noopener noreferrer">Arcane Spec Discord</a> <br />
      <a href="https://www.altered-time.com/forum/" target="_blank" rel="noopener noreferrer">Altered Time (Mage Forums/Guides)</a> <br />
      <a href="https://www.icy-veins.com/wow/arcane-mage-pve-dps-guide" target="_blank" rel="noopener noreferrer">Icy Veins (Arcane Mage Guide)</a> <br /><br />

      <Warning>
        This spec's analysis isn't complete yet. What we do show should be good to use, but it does not show the complete picture.<br />
        If there is something missing, incorrect, or inaccurate, please report it on <a href="https://github.com/WoWAnalyzer/WoWAnalyzer/issues/new">GitHub</a> or contact us on <a href="https://discord.gg/AxphPxU">Discord</a>.
      </Warning>
    </Wrapper>
  ),

  changelog: CHANGELOG,
  parser: CombatLogParser,
  path: __dirname, // used for generating a GitHub link directly to your spec
};
