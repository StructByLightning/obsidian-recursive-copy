const { Plugin, TFolder, TFile, Notice, MarkdownView } = require('obsidian');

class RecursiveCopyPlugin extends Plugin {
  onload() {
    // Register the command
    this.addCommand({
      id: 'copy-folder-contents',
      name: 'Copy Folder Contents',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return false;

        const file = view.file;
        const folder = file ? file.parent : null;

        if (folder) {
          if (!checking) {
            this.copyFolderContents(folder);
          }
          return true;
        }
        return false;
      }
    });

    // Add the context menu item
    this.fileMenuEventRef = this.app.workspace.on('file-menu', (menu, file) => {
      if (file instanceof TFolder) {
        menu.addItem((item) => {
          item
            .setTitle('Copy contents')
            .setIcon('files')
            .onClick(() => this.copyFolderContents(file));
        });
      }
    });

    // Register the event for management by the plugin system
    this.registerEvent(this.fileMenuEventRef);
  }

  onunload() {
    // Explicitly unregister the event handler
    this.app.workspace.offref(this.fileMenuEventRef);
  }

  async copyFolderContents(folder) {
    const content = await this.recursiveCopyMdFiles(folder);
    await navigator.clipboard.writeText(content);
    new Notice(`Copied Markdown from ${folder.name} to clipboard`);
  }

  async recursiveCopyMdFiles(folder) {
    let content = '';
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === 'md') {
        content += `File: ${child.path}\n\n`;
        content += await this.app.vault.read(child);
        content += '\n\n---\n\n';
      } else if (child instanceof TFolder) {
        content += await this.recursiveCopyMdFiles(child);
      }
    }
    return content;
  }
}

module.exports = RecursiveCopyPlugin;