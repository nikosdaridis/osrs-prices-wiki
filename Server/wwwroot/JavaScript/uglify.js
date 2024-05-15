const { glob } = require('glob');
const { exec } = require('child_process');
const path = require('path');

(async () => {
    try {
        const filesToSkip = ['uglify.js', 'echarts.min.js'];
        const files = await glob('./wwwroot/JavaScript/**/*.js');

        files.forEach(file => {
            const fileName = path.basename(file);

            if (filesToSkip.includes(fileName)) {
                console.log(`Skipping file: ${file}`);
                return;
            }

            exec(`uglifyjs ${file} -o ${file} -c -m`, (err, stdout, stderr) => {
                if (err) {
                    console.error(`Error uglifying file ${file}:`, err);
                    process.exit(1);
                }

                if (stderr) {
                    console.error(`Error output for file ${file}:`, stderr);
                }

                console.log(`Successfully uglified ${file}`);
            });
        });
    } catch (err) {
        console.error('Error finding files:', err);
        process.exit(1);
    }
})();
