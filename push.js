const token = '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';
const owner = 'houge89';
const repo = 'virtual-glasses';

const fs = require('fs');
const path = require('path');

async function pushToGitHub() {
    const baseDir = path.join(__dirname);
    const filesToUpload = [];

    // 收集要上传的文件
    function collectFiles(dir, relativePath = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            const fullPath = path.join(dir, entry.name);
            const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                collectFiles(fullPath, relPath);
            } else {
                const content = fs.readFileSync(fullPath, 'utf-8');
                filesToUpload.push({ path: relPath, content });
            }
        }
    }

    collectFiles(baseDir);

    console.log(`找到 ${filesToUpload.length} 个文件待上传`);

    // 1. 获取默认分支的最新 commit SHA
    const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
    let latestSha = null;
    let defaultBranch = 'main';

    try {
        const repoRes = await fetch(repoUrl, { headers: { Authorization: `Bearer ${token}` } });
        const repoData = await repoRes.json();
        defaultBranch = repoData.default_branch || 'main';
        console.log(`默认分支: ${defaultBranch}`);

        // 获取最新 commit
        const branchRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (branchRes.ok) {
            const branchData = await branchRes.json();
            latestSha = branchData.object.sha;
            console.log(`最新 commit SHA: ${latestSha}`);
        } else {
            console.log('仓库为空，将创建初始提交');
        }
    } catch (err) {
        console.log('获取仓库信息失败:', err.message);
    }

    // 2. 创建 Blob 对象
    const blobs = [];
    for (const file of filesToUpload) {
        const blobRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: file.content,
                    encoding: 'utf-8'
                })
            }
        );
        if (!blobRes.ok) {
            const errText = await blobRes.text();
            console.error(`创建 Blob 失败 [${file.path}]:`, errText);
            continue;
        }
        const blobData = await blobRes.json();
        blobs.push({ path: file.path, sha: blobData.sha, mode: '100644', type: 'blob' });
        console.log(`  ✓ ${file.path}`);
    }

    console.log(`\n已创建 ${blobs.length} 个 blob`);

    // 3. 创建 Tree
    const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                base_tree: latestSha || undefined,
                tree: blobs
            })
        }
    );
    const treeData = await treeRes.json();
    console.log(`Tree 已创建: ${treeData.sha}`);

    // 4. 创建 Commit
    const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/commits`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: '🎉 初始提交: 虚拟眼镜试戴 Web 应用',
                tree: treeData.sha,
                parents: latestSha ? [latestSha] : []
            })
        }
    );
    const commitData = await commitRes.json();
    console.log(`Commit 已创建: ${commitData.sha}`);

    // 5. 更新 Ref
    const refRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
        {
            method: latestSha ? 'PATCH' : 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sha: commitData.sha,
                force: true
            })
        }
    );
    const refData = await refRes.json();
    console.log(`\n✅ 推送成功！`);
    console.log(`   https://github.com/${owner}/${repo}`);
    console.log(`   文件数: ${blobs.length}`);
}

pushToGitHub().catch(err => console.error('推送失败:', err));
