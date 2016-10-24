import * as fn from './fn';

/**
 * A poor man's UI library
 * For when you want to work with the raw DOM
 */

interface StyleSpec {
  [index: string]: string | number;
}

interface DomElementSpec {
  style?: StyleSpec,
  [index: string]: StyleSpec | Function | string | number;
}

type DomFactoryParam = string | number | HTMLElement | DomElementSpec;

function isDomElementSpec (arg: DomFactoryParam): arg is DomElementSpec {
  return typeof arg === 'object';
}

function domFactoryFactory <T extends HTMLElement> (elementName: string) {
  /**
   * Function which create DOM elements with corresponding tag names
   * and initializes them with certain properties
   * Arguments may be accepted in any order:
   * - HTMLElement - the element is appended to the object in that position
   * - String - A text node is created and appended to the object
   * - Object - Properties of the object are assigned to the element
   *    * type is Function and name starts with "on" - Added as an event callback
   *    * Otherwise, assigned through setAttribute()
   */
  return function domFactory (...args: DomFactoryParam[]): T {
    const element: T = <T> document.createElement(elementName);
    for (let arg of args) {
      if (arg instanceof HTMLElement) {
        element.appendChild(arg);
      }
      else if (isDomElementSpec(arg)) {
        for (let [key, value] of fn.ienumerate(arg)) {

          // event handlers
          if (key === 'style') {
            for (let [styleName, styleValue] of fn.ienumerate(<StyleSpec> value)) {
              const domStyleName = styleName.replace(/-[a-z]/g, char => char.toUpperCase());
              element.style[domStyleName] = '' + styleValue;
            }
          }
          else if (typeof value === 'function') {
            if (key.startsWith('on')) {
              element[key] = value;
            } else {
              element.addEventListener(key, <EventListener> value);
            }
          }
          // other properties
          else {
            const strValue = '' + value;
            element.setAttribute(key, strValue);
          }
        }
      }
      else if (typeof arg === 'string' || typeof arg === 'number') {
        element.appendChild(document.createTextNode('' + arg));
      }
      else {
        throw Error(`Unknown argument type ${arg}`)
      }
    }
    return element;
  }
}

export const a        = domFactoryFactory<HTMLAnchorElement>          ('a');
export const aside    = domFactoryFactory<HTMLElement>                ('aside');
//export const b        = domFactoryFactory<HTMLPhraseElement>          ('b');
export const button   = domFactoryFactory<HTMLButtonElement>          ('button');
export const canvas   = domFactoryFactory<HTMLCanvasElement>          ('canvas');
export const col      = domFactoryFactory<HTMLTableColElement>        ('col');
export const colgroup = domFactoryFactory<HTMLTableColElement>        ('colgroup');
export const div      = domFactoryFactory<HTMLDivElement>             ('div');
export const form     = domFactoryFactory<HTMLFormElement>            ('form');
export const h1       = domFactoryFactory<HTMLHeadingElement>         ('h1');
export const h2       = domFactoryFactory<HTMLHeadingElement>         ('h2');
export const h3       = domFactoryFactory<HTMLHeadingElement>         ('h3');
export const h4       = domFactoryFactory<HTMLHeadingElement>         ('h4');
export const h5       = domFactoryFactory<HTMLHeadingElement>         ('h5');
export const h6       = domFactoryFactory<HTMLHeadingElement>         ('h6');
export const h7       = domFactoryFactory<HTMLHeadingElement>         ('h7');
export const header   = domFactoryFactory<HTMLElement>                ('header');
export const hr       = domFactoryFactory<HTMLHRElement>              ('hr');
//export const i        = domFactoryFactory<HTMLPhraseElement>          ('i');
export const img      = domFactoryFactory<HTMLImageElement>           ('img');
export const input    = domFactoryFactory<HTMLInputElement>           ('input');
export const li       = domFactoryFactory<HTMLLIElement>              ('li');
export const main     = domFactoryFactory<HTMLElement>                ('main');
export const nav      = domFactoryFactory<HTMLElement>                ('nav');
export const ol       = domFactoryFactory<HTMLOListElement>           ('ol');
export const option   = domFactoryFactory<HTMLOptionElement>          ('option');
export const p        = domFactoryFactory<HTMLParagraphElement>       ('p');
export const select   = domFactoryFactory<HTMLSelectElement>          ('select');
export const span     = domFactoryFactory<HTMLSpanElement>            ('span');
export const table    = domFactoryFactory<HTMLTableElement>           ('table');
export const tbody    = domFactoryFactory<HTMLTableSectionElement>    ('tbody');
export const td       = domFactoryFactory<HTMLTableDataCellElement>   ('td');
export const textarea = domFactoryFactory<HTMLTextAreaElement>        ('textarea');
export const th       = domFactoryFactory<HTMLTableHeaderCellElement> ('th');
export const thead    = domFactoryFactory<HTMLTableSectionElement>    ('thead');
export const tfoot    = domFactoryFactory<HTMLTableSectionElement>    ('tfoot');
export const tr       = domFactoryFactory<HTMLTableRowElement>        ('tr');
export const ul       = domFactoryFactory<HTMLUListElement>           ('ul');

/** Remove all children from a parent element **/
export function removeChildren (element: HTMLElement) {
  for (let i of Array.from(element.childNodes)) {
    element.removeChild(i);
  }
}

export function insertChildAtIndex (parent: Element, index: number, child: Element) {
  // "|| null" converts undefineds to nulls.
  // Node.insertBefore() interprets null nextSiblings as "append at the end"
  const nextSibling = parent.children[index] || null;
  return parent.insertBefore(child, nextSibling);
}

export function removeChildAtIndex (parent: Element, index: number) {
  return parent.removeChild(parent.children[index]);
}

export function getIndexOfElementInParent (element: HTMLElement) {
  return Array.prototype.indexOf.call(element.parentElement.children,
      element);
}
