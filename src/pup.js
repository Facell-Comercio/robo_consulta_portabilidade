const pup = require('puppeteer')

async function pupInit(headless = true){
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await pup.launch({
                ignoreDefaultArgs: ['--disable-extensions'],
                args: ['--incognito', "--no-sandbox",
                    "--disable-setuid-sandbox"],
                headless: headless
            })
            const pages = await browser.pages()
            const page = pages.length > 0 ? pages[0] : await browser.newPage()

            resolve({
                browser, page
            })
        } catch (error) {
            reject(error)
        }
    })
}

async function pupClose({ browser, page }) {
    return new Promise(async (resolve) => {
        try {
            if(page){
                await page.close();
            }
            if(browser){
                await browser.close();
            }

            resolve(true)
        } catch (error) {
            resolve(true)
        }
    })
}

module.exports = {
    pupInit,
    pupClose
}