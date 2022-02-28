import babel from 'rollup-plugin-babel'; /**支持node_module中的ES6语法**/
import commonjs from 'rollup-plugin-commonjs';/**解析commonjs**/
import resolve from 'rollup-plugin-node-resolve';  /**打包node_module第三方插件**/
import { eslint } from 'rollup-plugin-eslint'; /**使用eslint**/
import { terser } from 'rollup-plugin-terser' /**压缩代码**/
import builtins from 'rollup-plugin-node-builtins'/**打包node内置文件**/

const NODE_ENV = process.env.NODE_ENV

// 通用的插件
const basePlugins = [
    babel({
        exclude: 'node_modules/**'
    }),
    commonjs(),
    resolve({
        jsnext: true,
        main: true,
        browser: true
    }),
    builtins(),
    eslint({
        throwOnError: true,
        throwOnWarning: true,
        include: ['src/**'],
        exclude: ['node_modules/**']
    }),
]
// 开发环境需要使用的插件
const devPlugins = [
]
// 生产环境需要使用的插件
const prodPlugins = [
    terser()
]
//通过判断环境使用相应的插件
function Plugins(key) {
    switch (key) {
        case 'development':
            return [...basePlugins].concat(devPlugins)
        case 'production':
            return [...basePlugins].concat(prodPlugins);
        default:
            return [];
    }
}

/**通过判断环境选择导出的文件名**/
function Output(key) {
    switch (key) {
        case 'development':
            return [{
                file: 'xh-jssdk/mqtt.cjs.js',
                format: 'cjs',
            }, {
                file: 'xh-jssdk/mqtt.js',
                name: 'mqttServer',
                format: 'umd',
            }, {
                file: 'xh-jssdk/mqtt.esm.js',
                format: 'esm',
            }, {
                file: 'xh-jssdk/mqtt.system.js',
                format: 'system',
            }];
        case 'production':
            return [{
                file: 'xh-jssdk/mqtt.cjs.min.js',
                format: 'cjs',
            }, {
                file: 'xh-jssdk/mqtt.min.js',
                name: 'mqttServer',
                format: 'umd',
            }, {
                file: 'xh-jssdk/mqtt.esm.min.js',
                format: 'esm',
            }, {
                file: 'xh-jssdk/mqtt.system.min.js',
                format: 'system',
            }];
        default:
            return [{
                file: 'xh-jssdk/mqtt.cjs.min.js',
                format: 'cjs',
            }, {
                file: 'xh-jssdk/mqtt.min.js',
                name: 'mqttServer',
                format: 'umd',
            }, {
                file: 'xh-jssdk/mqtt.esm.min.js',
                format: 'esm',
            }, {
                file: 'xh-jssdk/mqtt.system.min.js',
                format: 'system',
            }];
    }
}
export default {
    input: 'index.js',
    output: Output(NODE_ENV),
    watch: {
        exclude: ['xh-jssdk', 'lib']
    },
    plugins: Plugins(NODE_ENV),
}