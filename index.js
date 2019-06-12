/*
* Yaroslav Gaponov https://github.com/YaroslavGaponov/lzw
*/

function encode(buffer) {

    let index, dictionary;
    const init = () => {
        index = -1;
        dictionary = [index++, []];
        for (let i = 0; i < 256; i++) dictionary[1][i] = [index++, []];
    };

    init();

    const result = [];

    let curr = dictionary;
    let length = buffer.length;
    for (let i = 0; i < length; i++) {
        const next = curr[1][buffer[i]];
        if (next) {
            curr = next;
        } else {
            result.push(curr[0], buffer[i]);
            if (index >= 0xfff) init();
            curr[1][buffer[i]] = [index++, []];
            curr = dictionary;
        }
    }

    if (curr[0] !== -1) result.push(curr[0]);

    const result2 = [];
    let tmp = 0;
    length = result.length;
    for (let i = 0; i < result.length; i++) {
        if (i & 1) {
            result2.push(tmp | result[i] >>> 8);
            result2.push(result[i] & 0xff);
            tmp = 0;
        } else {
            result2.push(result[i] & 0xff);
            tmp = result[i] >>> 8 << 4;
        }
    }
    if (result.length & 1) result2.push(tmp);

    return Buffer.from(result2);
}


function decode(buffer) {

    let dictionary;
    const init = () => {
        dictionary = [];
        for (let i = 0; i < 256; i++) dictionary[i] = [i];
    };

    init();

    const result = [];
    let length = buffer.length;
    for (let i = 0; i < length; i += 3) {
        result.push(buffer[i] | (buffer[i + 1] & 0xf0) << 4);
        if (i + 2 < buffer.length) result.push(buffer[i + 2] | (buffer[i + 1] & 0x0f) << 8);
    }

    const result2 = [];
    let tmp = [];
    length = result.length;
    for (let i = 0; i < length; i++) {
        result2.push.apply(result2, dictionary[result[i]]);
        tmp.push(result[i]);
        if (tmp.length === 2) {
            dictionary.push(tmp.map(e => dictionary[e]).flat());
            tmp = [];
            if (dictionary.length >= 0xfff) init();
        }
    }

    return Buffer.from(result2);
}

module.exports = {
    encode,
    decode
};