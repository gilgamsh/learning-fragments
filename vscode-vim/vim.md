# Motions

## Basic Motions

### Left-Right Motions
| Status             | Command        | Description                                                                    |
| ------------------ | -------------- | ------------------------------------------------------------------------------ |
| :white_check_mark: | :1234: h       | left                                                                           |
| :white_check_mark: | :1234: l       | right                                                                          | 
| :white_check_mark: | 0              | to first character in the line                                                 |    
| :white_check_mark: | :1234: f{char} | to the Nth occurrence of {char} to the right                                   |
| :white_check_mark: | :1234: t{char} | till before the Nth occurrence of {char} to the right                          |
| :white_check_mark: | :1234: ;       | repeat the last "f", "F", "t", or "T" N times                                  |
| :white_check_mark: | :1234: ,       | repeat the last "f", "F", "t", or "T" N times in opposite direction            |

### Up-Down Motions

| Status             | Command   | Description                                                                               |
| ------------------ | --------- | ----------------------------------------------------------------------------------------- |
| :white_check_mark: | :1234: k  | up N lines                                                          |
| :white_check_mark: | :1234: j  | down N lines                                         |
| :white_check_mark: | :1234: gg | goto line N (default: first line), on the first non-blank character                       |
| :white_check_mark: | :1234: G  | goto line N (default: last line), on the first non-blank character                        |
| :white_check_mark: | :1234: %  | goto line N percentage down in the file; N must be given, otherwise it is the `%` command |

### Text object motions

| Status             | Command    | Description                                                 |
| ------------------ | ---------- | ----------------------------------------------------------- |
| :white_check_mark: | :1234: w   | N words forward                                             |
| :white_check_mark: | :1234: W   | N blank-separated WORDs forward                             |
| :white_check_mark: | :1234: e   | N words forward to the end of the Nth word                  |
| :white_check_mark: | :1234: E   | N words forward to the end of the Nth blank-separated WORD  |
| :white_check_mark: | :1234: b   | N words backward                                            |
| :white_check_mark: | :1234: B   | N blank-separated WORDs backward                            |
| :white_check_mark: | :1234: ge  | N words backward to the end of the Nth word                 |
| :white_check_mark: | :1234: gE  | N words backward to the end of the Nth blank-separated WORD |
| :white_check_mark: | :1234: )   | N sentences forward                                         |
| :white_check_mark: | :1234: (   | N sentences backward                                        |
| :white_check_mark: | :1234: }   | N paragraphs forward                                        |
| :white_check_mark: | :1234: {   | N paragraphs backward                                       |
| :white_check_mark: | :1234: ]]  | N sections forward, at start of section                     |
| :white_check_mark: | :1234: [[  | N sections backward, at start of section                    |
| :white_check_mark: | :1234: ][  | N sections forward, at end of section                       |
| :white_check_mark: | :1234: []  | N sections backward, at end of section                      |
| :white_check_mark: | :1234: [(  | N times back to unclosed '('                                |
| :white_check_mark: | :1234: [{  | N times back to unclosed '{'                                |
| :white_check_mark: | :1234: ])  | N times forward to unclosed ')'                             |
| :white_check_mark: | :1234: ]}  | N times forward to unclosed '}'                             |
| :arrow_down:       | :1234: [#  | N times back to unclosed "#if" or "#else"                   |
| :arrow_down:       | :1234: ]#  | N times forward to unclosed "#else" or "#endif"             |
| :arrow_down:       | :1234: [\* | N times back to start of a C comment "/\*"                  |
| :arrow_down:       | :1234: ]\* | N times forward to end of a C comment "\*/"                 |

## Repeating Commands

| Status                    | Command                           | Description                                                                                        | 
| ------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- | 
| :white_check_mark: :star: | :1234: .                          | repeat last change (with count replaced with N)                                                    |

