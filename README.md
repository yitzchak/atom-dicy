# Atom-DiCy

Compile LaTeX, knitr, literate Agda, literate Haskell and Pweave documents using
[DiCy][].

## Installation

Use the Atom package manager and search for "dicy" or run `apm install dicy`
from the command line.

### TeX Distribution

In order to use this package you must have an up-to-date TeX distribution such
as [TeX Live][] or [MiKTeX][] installed. The binaries of your TeX distribution
must be available in the executable search path. This search path can be
customized via the `$PATH` setting or via [DiCy environment variables][].

### Language Syntax Packages

The various commands provided by this package depend upon the document grammar
type being detected by Atom. In order for the correct grammar to be detected you
will need to have the appropriate language syntax package installed. The table
below lists the required language package for each document type.

| Document Type    | Required Language Packages            |
|------------------|---------------------------------------|
| LaTeX            | [language-latex][]                    |
| knitr            | [language-r][] and [language-knitr][] |
| literate Agda    | [language-agda][]                     |
| literate Haskell | [language-haskell][]                  |
| Pweave           | [language-weave][]                    |

### Atom IDE Packages

Busy status during document compilation and log messages reported by DiCy are
displayed in Atom using the [Atom IDE][] package. Therefore the Atom IDE package
must also be installed in order to for this information to be displayed.

## Usage

| Command           | Keybinding                                  | Use                                   |
|:------------------|:-------------------------------------------:|:--------------------------------------|
| `dicy:build`      | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>b</kbd> | Build DiCy document and open results. |
| `dicy:clean`      | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>c</kbd> | Cleanup files after a build.          |
| `dicy:scrub`      | None                                        | Scub files after a build.             |
| `dicy:kill`       | None                                        | Terminate currently running build.    |
| `dicy:open`       | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>o</kbd> | Open build results.                   |
| `dicy:initialize` | None                                        | Initialize file openers, etc.         |

[Atom IDE]: https://ide.atom.io/
[DiCy environment variables]: https://yitzchak.github.io/dicy/options#environment-variables
[DiCy]: https://yitzchak.github.io/dicy/
[language-agda]: https://atom.io/packages/language-agda
[language-haskell]: https://atom.io/packages/language-haskell
[language-knitr]: https://atom.io/packages/language-knitr
[language-latex]: https://atom.io/packages/language-latex
[language-r]: https://atom.io/packages/language-r
[language-weave]: https://atom.io/packages/language-weave
[MiKTeX]: http://miktex.org/
[TeX Live]: https://www.tug.org/texlive/
