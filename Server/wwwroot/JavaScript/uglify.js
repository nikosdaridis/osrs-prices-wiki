const { glob } = require('glob');
const { exec } = require('child_process');
const path = require('path');

(async () => {
    try {
        const files = await glob('./wwwroot/JavaScript/**/*.js');
        const filesToSkip = ['uglify.js', 'echarts.min.js'];

        files.forEach(file => {
            const fileName = path.basename(file);

            if (filesToSkip.includes(fileName)) {
                console.log(`Uglify - Skipping file: ${file}`);
                return;
            }

            exec(`uglifyjs ${file} -o ${file} -c -m`, (error, stdout, stderror) => {
                if (error) {
                    console.error(`Uglify - Error file ${file}:`, error);
                    process.exit(1);
                }

                if (stderror) {
                    console.error(`Uglify - Error output for file ${file}:`, stderror);
                }

                console.log(`Uglify - Successfully uglified ${file}`);
            });
        });
    } catch (error) {
        console.error('Uglify - Error finding files:', error);
        process.exit(1);
    }
})();
