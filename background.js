function listener(details) {
    // console.log("Intercepting: " + details.url);

    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    let data = [];
    filter.ondata = event => {
        data.push(event.data);
    };

    filter.onstop = () => {
        let content = "";
        if (data.length === 1) {
            content = decoder.decode(data[0]);
        } else {
            for (let i = 0; i < data.length; i++) {
                let stream = (i !== data.length - 1);
                content += decoder.decode(data[i], {
                    stream
                });
            }
        }

        // add Start group to group list
        var regex = /var \S+=\[[^\]]+"Development"[^\]]+\]/g;
        var matches = content.match(regex);
        if (matches) {
            match = matches[0]
            newVar = match.substring(0, match.length - 1) + ',"Start"]'
            content = content.replace(match, newVar);
        }

        // add Start servers to servers list
        var regex = /"DEV1-S":{[^}]+}/g;
        var matches = content.match(regex);
        if (matches) {
            var match = matches[0];

            // info from: https://github.com/scaleway/scaleway-cli/pull/620
            var startServers = '"START1-XS":{order:1,group:"Start",subgroup:"Start",cores:"1 X86 64bit",storageNVMe:!0},'
            startServers += '"START1-S":{order:2,group:"Start",subgroup:"Start",cores:"2 X86 64bit",storageNVMe:!0},'
            startServers += '"START1-M":{order:3,group:"Start",subgroup:"Start",cores:"4 X86 64bit",storageNVMe:!0},'
            startServers += '"START1-L":{order:4,group:"Start",subgroup:"Start",cores:"8 X86 64bit",storageNVMe:!0},'

            content = content.replace(match, startServers + match);
        }

        filter.write(encoder.encode(content));
        filter.close();
    };
}


browser.webRequest.onBeforeRequest.addListener(
    listener, {
        urls: [
            "*://console.scaleway.com/static/js/chunk-*.js",
        ]
    },
    ["blocking"]
);