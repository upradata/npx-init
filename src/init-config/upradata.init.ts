// inspired by https://github.com/npm/init-package-json/blob/latest/default-input.js

import { InitContext, PkgJson, } from '../types';
import { niceName, pkgPrompts, validatePackageName, validateUrl } from '../util';

export const formatRepoUrl = (value: string) => `https://github.com/upradata/${value}`;
export const formatPkgName = (name: string) => name.startsWith('@upradata') ? name : `@upradata/${name}`;


export default async (ctx: InitContext): Promise<PkgJson> => {

    const projectName = niceName(ctx.package.name || ctx.dirname);

    const validatePkgName = (name: string) => {
        const realName = formatPkgName(name);

        const { isValid, error } = validatePackageName(realName);
        const partsNb = name.split('/').length;

        if (!isValid)
            return { error: `"${realName}": ${error.message}`, isValid };

        if (partsNb === 1)
            return { isValid };

        if (partsNb === 2 && name.startsWith('@upradata'))
            return { isValid };

        return { error: `"${realName}": Only 1 "/" accepted`, isValid };
    };


    const { name } = /*  ctx.yes ? { name: projectName } : */ await pkgPrompts({
        type: 'text',
        name: 'name',
        message: 'project name (no need to prefix with @upradata)',
        initial: projectName,
    }, {
        validate: v => {
            const { isValid, error } = validatePkgName(v);
            return isValid || error;
        },
        format: formatPkgName
    });


    const pkgNameInOrg = name.split('/').slice(-1)[ 0 ];
    const validateRepoUrl = (value: string) => validateUrl(formatRepoUrl(value));

    const { repository } = ctx.yes ? { repository: { url: formatRepoUrl(pkgNameInOrg) } } : await pkgPrompts({
        type: 'text',
        name: 'repository',
        message: 'repository name in @upradata organization',
        initial: `https://github.com/upradata/${pkgNameInOrg}`,
    }, {
        validate: value => validateRepoUrl(value) || `"${value}": URL not well formatted`,
        format: value => ({ url: formatRepoUrl(value) })
    });


    const { homepage } = ctx.yes ? { homepage: '' } : await pkgPrompts({
        type: 'text',
        name: 'homepage',
        message: 'website homepage'
    });

    const { description } = ctx.yes ? { description: '' } : await pkgPrompts({
        type: 'text',
        name: 'description',
        message: 'description'
    });


    const basicKeywords = [ 'upradata', 'typescript', 'ts' ];

    const { keywords } = ctx.yes ? { keywords: basicKeywords } : await pkgPrompts({
        type: 'list',
        name: 'keywords',
        message: 'keywords'
    }, {
        format: keywords => [ ...basicKeywords, ...keywords ].filter(v => !!v)
    });


    const packageJson = {
        name,
        author: {
            name: 'Upra-Data',
            email: 'code@upradata.com',
            url: 'https://github.com/upradata'
        },
        keywords,
        maintainers: [
            {
                name: 'Thomas Milotti',
                email: 'thomas.milotti@gmail.com',
                url: 'https://github.com/milottit'
            }
        ],
        repository,
        homepage,
        bin: '',
        license: 'MIT',
        version: '1.0.0',
        description,
        sideEffects: false,
        main: 'lib',
        types: 'lib-esm',
        module: 'lib-esm',
        files: [
            'lib',
            'lib-esm'
        ],
        scripts: {
            clean: 'shx rm -rf lib lib-esm',
            'pre:build': 'npm run clean',
            build: `concurrently 'tsc -p tsconfig.lib.json' 'tsc -p tsconfig.lib-esm.json'`,
            'post:build': 'npm run test && npm run e2e',
            watch: 'pnpm run build:watch',
            'build:watch': `concurrently 'tsc -p tsconfig.lib.json -w' 'tsc -p tsconfig.lib-esm.json -w'`,
            test: 'npx jest --verbose false --config jest-ut.config.js',
            e2e: 'npx jest --passWithNoTests --verbose false --config jest-e2e.config.js',
            version: 'npm version',
            'github-push': 'npm version patch && git pushall && git pushall-tags',
            'npm-publish': 'npm run build && npm publish --access public'
        }
    };


    return packageJson;
};
