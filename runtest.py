from unittest import TestLoader, TextTestRunner

if __name__ == '__main__':
    #discovers and runs all the tests within the tests folder
    test_loader = TestLoader()
    test_folder = test_loader.discover('tests')

    test_runner = TextTestRunner(verbosity=2) # verbosity -> gives detailed output showing test name & result
    test_runner.run(test_folder)