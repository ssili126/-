// 用于获取元素的XPath路径，考虑元素在其父节点中的索引
function getElementXPath(element) {
    if (!element) {
        return '';
    }
    if (element === document.documentElement) {
        return '/html';
    }
    let index = 1;
    const siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling === element) {
            break;
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            index++;
        }
    }
    const tagName = element.tagName.toLowerCase();
    const parentXPath = getElementXPath(element.parentNode);
    return `${parentXPath}/${tagName}[${index}]`;
}

// 比较两个XPath路径，找出不同部分，并生成从 1 到 9999 的 XPath 列表
function generateXPathList(xpath1, xpath2) {
    const parts1 = xpath1.split('/').filter(part => part);
    const parts2 = xpath2.split('/').filter(part => part);
    let diffIndex = -1;

    // 找出第一个不同的部分
    for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
        if (parts1[i]!== parts2[i]) {
            diffIndex = i;
            break;
        }
    }

    if (diffIndex === -1) {
        return [xpath1];
    }

    const commonPrefix = parts1.slice(0, diffIndex).join('/');
    const basePart1 = parts1[diffIndex];
    const basePart2 = parts2[diffIndex];

    const numMatch1 = basePart1.match(/\d+/);
    const numMatch2 = basePart2.match(/\d+/);

    if (numMatch1 && numMatch2) {
        const xpathList = [];
        for (let i = 1; i <= 9999; i++) {
            const newPart = basePart1.replace(numMatch1[0], i);
            const newXPath = commonPrefix + '/' + newPart + '/' + parts1.slice(diffIndex + 1).join('/');
            xpathList.push(newXPath);
        }
        return xpathList;
    } else {
        return [xpath1, xpath2];
    }
}

// 声明 firstClickElement 和 secondClickElement 变量
let firstClickElement = null;
let secondClickElement = null;

// 右键点击事件监听器
document.addEventListener('contextmenu', function (event) {
    if (event.ctrlKey) {
        event.preventDefault();

        if (!event.target) {
            return;
        }

        // 添加高亮样式
        const style = document.createElement('style');
        style.textContent = `.highlight { background-color: yellow; }`;
        if (!document.head.querySelector('style[content=".highlight { background-color: yellow; }"]')) {
            document.head.appendChild(style);
        }

        if (!firstClickElement) {
            firstClickElement = event.target;
            firstClickElement.classList.add('highlight');
            const xpath = getElementXPath(firstClickElement);
            console.log('第一次点击元素的 XPath:', xpath);
            // 验证 XPath 路径
            const elements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            console.log('验证第一次点击元素的 XPath，获取到的元素数量:', elements.snapshotLength);
        } else if (!secondClickElement) {
            secondClickElement = event.target;
            secondClickElement.classList.add('highlight');
            const xpath = getElementXPath(secondClickElement);
            console.log('第二次点击元素的 XPath:', xpath);
            // 验证 XPath 路径
            const elements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            console.log('验证第二次点击元素的 XPath，获取到的元素数量:', elements.snapshotLength);

            const xpathList = generateXPathList(getElementXPath(firstClickElement), getElementXPath(secondClickElement));
            console.log('生成的 XPath 列表:', xpathList);

            handleXPathList(xpathList);

            // 重置点击元素状态
            firstClickElement = null;
            secondClickElement = null;
        }
    }
});

// 解析 XPath 列表并获取所有元素，然后进行下载操作
function handleXPathList(xpathList) {
    let allElements = [];
    xpathList.forEach(xpath => {
        let elements;
        try {
            elements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            const elementList = [];
            for (let i = 0; i < elements.snapshotLength; i++) {
                elementList.push(elements.snapshotItem(i));
            }
            allElements = allElements.concat(elementList);
            console.log(`通过 XPath 选择器 ${xpath} 获取到的元素数量:`, elementList.length);
        } catch (error) {
            console.error(`解析 XPath 选择器 ${xpath} 时出错:`, error);
        }
    });

    if (allElements.length === 0) {
        alert('未找到任何匹配的元素，请检查选择器是否正确');
        return;
    }

    // 为匹配的元素添加高亮类
    allElements.forEach(element => {
        element.classList.add('highlight');
    });

    let dataString = '';
    allElements.forEach((element, index) => {
        const elementText = getElementAllText(element);
        dataString += `内容第 ${index + 1} 条：`;
        if (elementText) {
            dataString += elementText + '\n';
        }
    });

    // 创建 Blob 对象
    const blob = new Blob([dataString], { type: 'text/plain;charset=utf-8' });
    // 创建一个临时的 URL
    const url = URL.createObjectURL(blob);
    // 创建一个 a 标签用于下载
    const a = document.createElement('a');
    a.href = url;
    a.download ='selected_data.txt';
    console.log('准备触发下载，URL:', url);
    try {
        a.click();
    } catch (error) {
        console.error('触发下载时出错:', error);
    }
    // 释放 URL
    URL.revokeObjectURL(url);
}

// 解析XPath并获取所有元素，然后进行下载操作
function handleXPath(xpath) {
    let elements;
    try {
        elements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        const elementList = [];
        for (let i = 0; i < elements.snapshotLength; i++) {
            elementList.push(elements.snapshotItem(i));
        }
        elements = elementList;
        console.log('通过XPath选择器获取到的元素数量:', elements.length);
    } catch (error) {
        console.error(`解析XPath选择器 ${xpath} 时出错:`, error);
    }

    if (elements.length === 0) {
        alert('未找到任何匹配的元素，请检查选择器是否正确');
        return;
    }

    // 添加高亮样式
    const style = document.createElement('style');
    style.textContent = `.highlight { background-color: yellow; }`;
    if (!document.head.querySelector('style[content=".highlight { background-color: yellow; }"]')) {
        document.head.appendChild(style);
    }

    // 为匹配的元素添加高亮类
    elements.forEach(element => {
        element.classList.add('highlight');
    });

    let dataString = '';
    elements.forEach((element, index) => {
        const elementText = getElementAllText(element);
        dataString += `内容第 ${index + 1} 条：`;
        if (elementText) {
            dataString += elementText + '\n';
        }
    });

    // 创建 Blob 对象
    const blob = new Blob([dataString], { type: 'text/plain;charset=utf-8' });
    // 创建一个临时的 URL
    const url = URL.createObjectURL(blob);
    // 创建一个 a 标签用于下载
    const a = document.createElement('a');
    a.href = url;
    a.download ='selected_data.txt';
    console.log('准备触发下载，URL:', url);
    try {
        a.click();
    } catch (error) {
        console.error('触发下载时出错:', error);
    }
    // 释放 URL
    URL.revokeObjectURL(url);
}

// 递归获取元素及其子元素的所有文本内容
function getElementAllText(element) {
    let text = '';
    const children = element.childNodes;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            text += getElementAllText(child);
        }
    }
    return text.trim();
}