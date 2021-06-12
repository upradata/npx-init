import validateName from 'validate-npm-package-name';
import { makePrompts } from './prompts';
import { PkgJsonKeys } from './types';


export const niceName = (n: string) => {
    return n.replace(/^node-|[.-]js$/g, '').replace(/\s+/g, ' ').replace(/ /g, '-').toLowerCase();
};


export const pkgPrompts = makePrompts<PkgJsonKeys>();

export const validatePackageName = (name: string) => {
    const its = validateName(name);

    if (its.validForNewPackages)
        return { name };

    const errors = (its.errors || []).concat(its.warnings || []);
    const error = new Error(`Sorry, ${errors.join(' and ')}.`);

    return { error };
};


export interface Person {
    name?: string;
    url?: string;
    email?: string;
}

export interface ExtendedPerson extends Person {
    web?: string;
    mail?: string;
}


// flatten => "Barney Rubble <b@rubble.com> (http://barnyrubble.tumblr.com/)"

export const flattenPerson = (person: string | ExtendedPerson): string => {
    if (typeof person === 'string')
        return person;

    const { name = '', url, web, email, mail } = person;

    const u = url || web;
    const formattedUrl = u ? (` (${u})`) : '';

    const e = email || mail;
    const formattedEmail = e ? (` <${e}>`) : '';

    return name + formattedEmail + formattedUrl;
};



const personRx = {
    email: /<(.*)>/,
    url: /\((.*)\)/,
    name: /^([^<(].*?)\s*[<(]/
};

export const unflattenPerson = (person: string | ExtendedPerson): Person => {
    if (typeof person !== 'string')
        return person;

    const name = person.match(personRx.name)?.[ 1 ];
    const url = person.match(personRx.url)?.[ 1 ];
    const email = person.match(personRx.email)?.[ 1 ];

    return { name, url, email };
};


// turn the objects into somewhat more humane strings.
export const flattenPeople = (data: Record<'author' | 'maintainers' | 'contributors', string | ExtendedPerson>) => {
    return Object.fromEntries(Object.entries(data).map(
        ([ k, p ]) => [ k, Array.isArray(p) ? p.map(flattenPerson) : flattenPerson(p) ])
    );
};
