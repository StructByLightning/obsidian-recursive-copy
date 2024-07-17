const obsidian = require('obsidian');

module.exports = class FolderContextMenuPlugin extends obsidian.Plugin {
  async onload() {
    // Register the command
    this.addCommand({
      id: 'copy-folder-contents',
      name: 'Copy Folder Contents',
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile();
        const activeFolder = activeFile ? activeFile.parent : null;
        
        if (activeFolder) {
          if (!checking) {
            this.copyFolderContents(activeFolder);
          }
          return true;
        }
        return false;
      }
    });

    // Add the context menu item
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof obsidian.TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Copy contents')
              .setIcon('files')
              .onClick(() => this.copyFolderContents(file));
          });
        }
      })
    );
  }

  async copyFolderContents(folder) {
    const content = await this.recursiveCopyMdFiles(folder);
    await navigator.clipboard.writeText(content);
    new obsidian.Notice(`Copied Markdown from ${folder.name} to clipboard`);
  }

  async recursiveCopyMdFiles(folder) {
    let content = '';
    for (const child of folder.children) {
      if (child instanceof obsidian.TFile && child.extension === 'md') {
        content += `File: ${child.path}\n\n`;
        content += await this.app.vault.read(child);
        content += '\n\n---\n\n';
      } else if (child instanceof obsidian.TFolder) {
        content += await this.recursiveCopyMdFiles(child);
      }
    }
    return content;
  }
}