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
| ---------------- | ------------------------------------- |
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

While editing a document various DiCy commands can issued via the commands
listed in the table below. Only one command is allowed to be active at a time,
but commands such as `dicy:build` can run concurrently on different files. All
commands can be run from the main root document or from sub-document provided
that the sub-document has a TeX magic root statement such as
`%!TeX root=foo.tex` at the beginning of the file.

| Command           |                  Keybinding                 | Use                                                               |
| :---------------- | :-----------------------------------------: | :---------------------------------------------------------------- |
| `dicy:build`      | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>b</kbd> | Build DiCy document and open results.                             |
| `dicy:clean`      | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>c</kbd> | Cleanup intermediate files after a build.                         |
| `dicy:scrub`      |                     None                    | Cleanup all files after a build.                                  |
| `dicy:kill`       |                     None                    | Terminate build associated with current file.                     |
| `dicy:kill-all`   |                     None                    | Terminate all builds in progress.                                 |
| `dicy:open`       | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>o</kbd> | Open build results and sync.                                      |
| `dicy:sync`       |                     None                    | Open build results and sync without loading from DiCy file cache. |
| `dicy:initialize` |                     None                    | Initialize file openers, etc.                                     |

## Configuration

There are three types of configuration settings available on the settings page
of Atom-DiCy. These settings are described in the following sections.

### Event Configuration

Various events can be configured to automatically trigger a building or opening
results via the `Event` settings section. Enabling `Build after Save` will cause
`dicy:build` to automatically be run when a compatible document is saved. To
automatically open any resulting output targets via the configured opener
`Open after Build` should be enabled. Lastly, automatic cursor position
synchronization via the `dicy:sync` command can be enabled with
`Sync after Cursor Change`.

### Open Configuration

In the `Open` settings section `Opener` controls which opener is used to open
build results such as PDF, PS or DVI files. The default setting of `automatic`
will attempt to select whichever opener available on the user's platform that
supports features requested by the user. For instance, if `SyncTeX` is enabled
in the `Build` settings section then openers that support SyncTex will have a
higher priority. Selecting a specific opener will override this automatic
selection. The table below lists the currently supported openers and the
features of each opener.

| Viewer        | Platforms | PDF |  PS | DVI | Background | SyncTeX |
| :------------ | :-------: | :-: | :-: | :-: | :--------: | :-----: |
| [Atril]       |   Linux   |  ✓  |  ✓  |  ✓  |      ✓     |    ✓    |
| [Evince]      |   Linux   |  ✓  |  ✓  |  ✓  |      ✓     |    ✓    |
| [Okular]      |   Linux   |  ✓  |  ✓  |  ✓  |      ✓     |    ✓    |
| [pdf-view]    |    Any    |  ✓  |     |     |      ✓     |    ✓    |
| [Preview]     |   MacOS   |  ✓  |  ✓  |     |      ✓     |         |
| [Skim]        |   MacOS   |  ✓  |  ✓  |  ✓  |      ✓     |    ✓    |
| [Sumatra PDF] |  Windows  |  ✓  |     |     |            |    ✓    |
| Shell Open    |  Windows  |  ✓  |  ✓  |  ✓  |            |         |
| [xdg-open]    |   Linux   |  ✓  |  ✓  |  ✓  |            |         |
| [Xreader]     |   Linux   |  ✓  |  ✓  |  ✓  |      ✓     |    ✓    |
| [Zathura]     |   Linux   |  ✓  |  ✓  |     |            |    ✓    |

The remaining settings in the `Open` section are `Open In Background` and
`pdf-view Split Direction`. `Open In Background` will attempt to keep the
cursor focus in Atom when using an opener. `pdf-view Split Direction` specifies
where to add an extra pane when using the `pdf-view` opener.

### Build Configuration

A limited selection of the build settings that DiCy uses can be configured via
the `Build` setting section. These settings will be written to the user's
configuration file. The location of this file is described at
[DiCy configuration][]. The build settings of DiCy, including the ones available
from the settings page are described at [DiCy options][].

[Atom IDE]: https://ide.atom.io/

[Atril]: http://mate-desktop.com/#atril

[DiCy configuration]: https://yitzchak.github.io/dicy/configuration

[DiCy environment variables]: https://yitzchak.github.io/dicy/options#environment-variables

[DiCy options]: https://yitzchak.github.io/dicy/options

[DiCy]: https://yitzchak.github.io/dicy/

[Evince]: https://wiki.gnome.org/Apps/Evince

[language-agda]: https://atom.io/packages/language-agda

[language-haskell]: https://atom.io/packages/language-haskell

[language-knitr]: https://atom.io/packages/language-knitr

[language-latex]: https://atom.io/packages/language-latex

[language-r]: https://atom.io/packages/language-r

[language-weave]: https://atom.io/packages/language-weave

[MiKTeX]: http://miktex.org/

[Okular]: https://okular.kde.org/

[pdf-view]: https://atom.io/packages/pdf-view

[Preview]: https://support.apple.com/en-us/HT201740

[Skim]: http://skim-app.sourceforge.net/

[Sumatra PDF]: http://www.sumatrapdfreader.org/free-pdf-reader.html

[TeX Live]: https://www.tug.org/texlive/

[xdg-open]: https://linux.die.net/man/1/xdg-open

[Xreader]: https://github.com/linuxmint/xreader

[Zathura]: https://github.com/pwmt/zathura
