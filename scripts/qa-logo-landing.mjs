import puppeteer from 'puppeteer';
import {mkdir, writeFile} from 'node:fs/promises';
const dir='docs/qa/logo-landing';
await mkdir(dir,{recursive:true});
const browser=await puppeteer.launch({headless:true});
const results=[];
try {
 for(const width of [375,768,1440]) for(const theme of ['light','dark']) {
  const page=await browser.newPage();
  await page.setViewport({width,height:900});
  await page.evaluateOnNewDocument(theme=>localStorage.setItem('theme',theme),theme);
  await page.goto('http://127.0.0.1:13012/',{waitUntil:'networkidle2'});
  await page.screenshot({path:`${dir}/${width}-${theme}.png`});
  const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,logos:[...document.querySelectorAll('[aria-label="Click Edital"], [aria-label="Click Edital — início"]')].map(e=>({images:e.querySelectorAll('img').length,text:e.textContent.trim(),loaded:e.querySelector('img')?.naturalWidth>0}))}));
  results.push({width,theme,...result});
  await page.close();
 }
} finally {await browser.close();}
await writeFile(`${dir}/results.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
if(results.some(r=>r.overflow||r.logos.some(l=>!l.loaded||l.text||l.images!==1)))process.exitCode=1;
