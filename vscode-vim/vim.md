## Key

:white_check_mark: - command done

:white_check_mark: :star: - command done with VS Code specific customization

:warning: - some variations of the command are not supported

:running: - work in progress

:arrow_down: - command is low priority; open an issue (or thumbs up the relevant issue) if you want to see it sooner

:x: - command impossible with current VSCode API

:1234: - command accepts numeric prefix


##  Motions

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

## Pattern searches

| Status                    | Command                            | Description                                            | Note                                                                            |
| ------------------------- | ---------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| :white_check_mark: :star: | :1234: `/{pattern}[/[offset]]<CR>` | search forward for the Nth occurrence of {pattern}     | Currently we only support JavaScript Regex but not Vim's in-house Regex engine. |
| :white_check_mark: :star: | :1234: `?{pattern}[?[offset]]<CR>` | search backward for the Nth occurrence of {pattern}    | Currently we only support JavaScript Regex but not Vim's in-house Regex engine. |
| :white_check_mark:        | :1234: n                           | repeat last search                                     |
| :white_check_mark:        | :1234: N                           | repeat last search, in opposite direction              |
| :white_check_mark:        | :1234: \*                          | search forward for the identifier under the cursor     |
| :white_check_mark:        | :1234: #                           | search backward for the identifier under the cursor    |
| :white_check_mark:        | :1234: g\*                         | like "\*", but also find partial matches               |
| :white_check_mark:        | :1234: g#                          | like "#", but also find partial matches                |
| :white_check_mark:        | gd                                 | goto local declaration of identifier under the cursor  |
| :arrow_down:              | gD                                 | goto global declaration of identifier under the cursor |

## Marks and motions

| Status             | Command             | Description                                            |
| ------------------ | ------------------- | ------------------------------------------------------ |
| :white_check_mark: | m{a-zA-Z}           | mark current position with mark {a-zA-Z}               |
| :white_check_mark: | `{a-z}              | go to mark {a-z} within current file                   |
| :white_check_mark: | `{A-Z}              | go to mark {A-Z} in any file                           |
| :white_check_mark: | `{0-9}              | go to the position where Vim was previously exited     |
| :white_check_mark: | ``                  | go to the position before the last jump                |
| :arrow_down:       | `"                  | go to the position when last editing this file         |
| :white_check_mark: | :marks              | print the active marks                                 |
| :white_check_mark: | :ju[mps]            | print the jump list                                    |

## Fold commands

Pretty much everything fold-related is blocked by [this issue](https://github.com/VSCodeVim/Vim/issues/1004).

| Status             | Command                  | Description                                                                                                  |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| :white_check_mark: | zo                       | Open one fold under the cursor.When a count is given, that many folds deep will be opened.                   |
| :white_check_mark: | zO                       | Open all folds under the cursor recursively.                                                                 |
| :white_check_mark: | zc                       | Close one fold under the cursor. When a count is given, that many folds deep are closed.                     |
| :white_check_mark: | zC                       | Close all folds under the cursor recursively.                                                                |
| :white_check_mark: | za                       | When on a closed fold: open it. When on an open fold: close it and set 'foldenable'.                         |
| :white_check_mark: | zM                       | Close all folds: set 'foldlevel' to 0. 'foldenable' will be set.                                             |
| :white_check_mark: | zR                       | Open all folds. This sets 'foldlevel' to highest fold level.                                                 |

## Tabs

| Status                    | Command                              | Description                                                                   | Note                                                               |
| ------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| :white_check_mark:        | :tabn[ext] :1234:                    | Go to next tab page or tab page {count}. The first tab page has number one.   |
| :white_check_mark:        | {count}&lt;C-PageDown&gt;, {count}gt | Same as above                                                                 |
| :white_check_mark:        | :tabp[revious] :1234:                | Go to the previous tab page. Wraps around from the first one to the last one. |
| :white_check_mark:        | :tabfir[st]                          | Go to the first tab page.                                                     |
| :white_check_mark:        | :tabl[ast]                           | Go to the last tab page.                                                      |
| :white_check_mark:        | :tabe[dit] {file}                    | Open a new tab page with an empty window, after the current tab page          |
| :white_check_mark:        | :tabnew {file}                       | Open a new tab page with an empty window, after the current tab page          |
| :white_check_mark: :star: | :tabc[lose][!] :1234:                | Close current tab page or close tab page {count}.                             | Code will close tab directly without saving.                       |
| :white_check_mark: :star: | :tabo[nly][!]                        | Close all other tab pages.                                                    | `!` is not supported, Code will close tab directly without saving. |
| :white_check_mark:        | :tabm[ove][n]                        | Move the current tab page to after tab page N.                                |

