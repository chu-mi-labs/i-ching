(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.IChingCore = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const LINE_POS_NAMES = ['初', '二', '三', '四', '五', '上'];

    function normalizeQuestion(value) {
        return String(value || '').trim();
    }

    function canStartQuestion(value) {
        return normalizeQuestion(value).length > 0;
    }

    function getLineInfo(sum) {
        if (sum === 6) return { symbol: '×', type: 'yin', change: true, name: '老陰' };
        if (sum === 7) return { symbol: '—', type: 'yang', change: false, name: '少陽' };
        if (sum === 8) return { symbol: '--', type: 'yin', change: false, name: '少陰' };
        if (sum === 9) return { symbol: '○', type: 'yang', change: true, name: '老陽' };
        throw new Error(`Invalid line sum: ${sum}`);
    }

    function getLineName(index, isYang) {
        const num = isYang ? '九' : '六';
        if (index < 0 || index > 5) throw new Error(`Invalid line index: ${index}`);
        const pos = LINE_POS_NAMES[index];
        if (index === 0) return '初' + num;
        if (index === 5) return '上' + num;
        return num + pos;
    }

    function deriveHexagramState(tosses) {
        if (!Array.isArray(tosses) || tosses.length !== 6) {
            throw new Error('Exactly six toss sums are required');
        }

        let origBinary = '';
        let changedBinary = '';
        const changingIndices = [];

        tosses.forEach((sum, index) => {
            getLineInfo(sum);
            origBinary += sum === 7 || sum === 9 ? '1' : '0';
            changedBinary += sum === 7 || sum === 6 ? '1' : '0';
            if (sum === 6 || sum === 9) changingIndices.push(index);
        });

        return { origBinary, changedBinary, changingIndices };
    }

    function shouldShowZhiGuaAnimation(changingIndices) {
        return changingIndices.length >= 3;
    }

    function getChangedLineSymbol(sum) {
        const info = getLineInfo(sum);
        const finalIsYang = info.change ? info.type === 'yin' : info.type === 'yang';
        return finalIsYang ? '━━━━━' : '━━ ━━';
    }

    function getOriginalLineSymbol(sum) {
        const info = getLineInfo(sum);
        return info.type === 'yang' ? '━━━━━' : '━━ ━━';
    }

    function getCoinSpinX(isYang, extraRound) {
        return 360 * (4 + extraRound) + (isYang ? 0 : 180);
    }

    function buildPromptText(question, tosses, origData, changedData, changingIndices, promptBuilder) {
        const changingCount = changingIndices.length;
        let allLinesDetail = '';

        for (let i = 5; i >= 0; i--) {
            const info = getLineInfo(tosses[i]);
            const isChange = info.change ? '【變爻】' : '';
            allLinesDetail += `- ${LINE_POS_NAMES[i]}爻：${info.name}${info.symbol}　${isChange}\n`;
        }

        let changeText = '';
        let changeValueText = '';
        if (changingCount === 0) {
            changeValueText = '0個';
            changeText = '變爻位置：無\n變爻爻辭：無';
        } else {
            changeValueText = `${changingCount}個`;
            const indicesText = changingIndices.map(i => i + 1).join(', ');
            const namesText = changingIndices.map(i => getLineName(i, tosses[i] === 9)).join(', ');
            const linesText = changingIndices.map(i => origData.lines[i]).join('\n');
            changeText = `變爻位置：第${indicesText}爻（${namesText}）\n變爻爻辭：\n${linesText}`;
        }

        return promptBuilder(question, origData, changedData, changingIndices, allLinesDetail, changeValueText, changeText);
    }

    function canUseClipboard(navigatorLike) {
        return Boolean(navigatorLike && navigatorLike.clipboard && typeof navigatorLike.clipboard.writeText === 'function');
    }

    return {
        normalizeQuestion,
        canStartQuestion,
        getLineInfo,
        getLineName,
        deriveHexagramState,
        shouldShowZhiGuaAnimation,
        getChangedLineSymbol,
        getOriginalLineSymbol,
        getCoinSpinX,
        buildPromptText,
        canUseClipboard
    };
});
