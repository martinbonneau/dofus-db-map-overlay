import path from 'path'
import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { createWindowPositionStore } from './store'

let win: BrowserWindow | null = null
const js = `
  const goToWebsite = document.createElement('a')
  const quitButton = document.createElement('button')
  const topLayout = document.createElement('div')
  
  topLayout.classList.add('dmo-top-layout')
  quitButton.classList.add('dmo-quit-btn')
  goToWebsite.classList.add('dmo-go-to-website-btn')
  
  quitButton.innerText = 'Quit app'
  quitButton.setAttribute('tab-index', '-1')
  quitButton.addEventListener('click', () => {
    dmo.quit()
  })
  
  goToWebsite.innerText = 'DOFUS DB'
  goToWebsite.setAttribute('tab-index', '-1')
  goToWebsite.addEventListener('click', (evt) => {
    evt.preventDefault()
    dmo.goToWebsite()
  })
  
  topLayout.appendChild(goToWebsite);
  topLayout.appendChild(quitButton);
  
  document.querySelectorAll('input[type="number"]').forEach(elem => {
    elem.setAttribute('type', 'text')
  })
  
  document.body.appendChild(topLayout);0
`
const css = `
.dmo-top-layout {
  position: fixed;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
  app-region: no-drag;
}



.dmo-quit-btn {
  cursor: pointer;
  border: none;
  background: transparent;
  color: inherit;
  z-index: 99 !important;
}

.dmo-go-to-website-btn {
  cursor: pointer;
  app-region: drag;
  color: inherit;
}

body {
  background: transparent !important;
  border: 1px var(--q-color-primary) solid;
  overflow: hidden;
}

body, html {
  height: 100vh !important;
}

.q-page-container {
  padding-top: 0 !important;
}

.q-page {
  padding: 0 !important;
}

.q-page > div:first-child {
  padding-top: 0;
}

main {
  height: 100vh !important;
}


/* Align ressources buttons to left and in column */
.resources-menu-button-list {
  flex-direction: column !important;
  align-items: flex-end !important;
  justify-content: flex-end !important;
  position: absolute !important;
  left: 90% !important;
  top: 0% !important;
}

/* Size of ressources buttons */
.resources-menu-button {
  width: 30px !important;
  height: 30px !important;
}

/* Size of ressource selecting menu */
.resources-menu-job {
  width: 180px !important;
}

div.map-menu-item__item__no-border > div:nth-child(1) > div:nth-child(1) {
  width: 30px !important;
  height: 30px !important;
}


/*.q-page > div > div:first-child, Title */
/*.q-page > div > div:nth-child(2),  Position */
/*.q-page > div > div:nth-child(4),  Direction */
/*.q-page > div > div:nth-child(6),  Indice */
/*.q-page > div > a,*/
.q-header,
/*.q-card > div:nth-child(4),*/
/*.q-card > div.text-center.q-pa-xs.text-grey-6,*/
/*.q-loading-bar,*/
.q-footer,
.q-notifications,
#q-app > div > div > main > div > div > div.absolute-top-left
{
  display: none !important;
}
.q-card > div:first-child.text-h5, .q-card > div:nth-child(2).text-h6 {
  font-size: 1rem;
}

.q-card > div:first-child.text-h5 i {
  margin-right: 6px;
  font-size: 1em !important;
}

.q-card > div:nth-child(2).text-h6 {
  font-size: 0;
  padding: 20px;
}

.q-card > div:nth-child(2).text-h6 span {
  font-size: 1rem;
}

.q-layout__shadow::after {
  box-shadow: none !important;
}

.q-field__control {
  padding: 0 4px !important;
}

.q-field__bottom, .q-field__append {
  display: none !important;
}

`

function createWindow() {
  const winStore = createWindowPositionStore()

  const { x = 10, y = 90 } = winStore.store

  win = new BrowserWindow({
    width: 250,
    height: 484,
    minWidth: 200,
    minHeight: 100,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
    },
    hasShadow: false,
    roundedCorners: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    acceptFirstMouse: true,
    x,
    y,
    show: false,
  })

  win.on('moved', () => {
    if (!win) return

    const [newX, newY] = win.getPosition()

    winStore.set({ x: newX, y: newY })
  })

  void win.loadURL('https://dofusdb.fr/fr/tools/map', { userAgent: 'Chrome' })

  win.webContents.on('did-finish-load', async () => {
    try {
      await Promise.all([win?.webContents.insertCSS(css), win?.webContents.executeJavaScript(js)])

      win?.show()
    } catch (err) {
      console.error(err)
      app.quit()
    }
  })

  win.on('closed', () => {
    win = null
  })

  ipcMain.handle('quit', () => {
    win?.close()
  })

  ipcMain.handle('go-to-website', () => {
    void shell.openExternal('https://dofusdb.fr/fr/tools/map')
  })
}

app.on('window-all-closed', () => {
  app.quit()
})

app.on('ready', createWindow)
