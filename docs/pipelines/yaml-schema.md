---
title: YAML schema
titleSuffix: Azure Pipelines
description: An overview of all YAML features.
ms.prod: devops
ms.technology: devops-cicd
ms.assetid: 2c586863-078f-4cfe-8158-167080cd08c1
ms.manager: douge
ms.author: macoope
ms.reviewer: macoope
ms.date: 10/18/2018
monikerRange: 'vsts'
---

# YAML schema reference

**Azure Pipelines**

Here's a detailed reference guide to Azure Pipelines YAML pipelines, including a catalog of all supported YAML capabilities, and the available options.

> The best way to get started with YAML pipelines is through the
[quickstart guide](get-started-yaml.md).
> After that, to learn how to configure your YAML pipeline the way you need it to work, see conceptual topics such as [Build variables](process/variables.md) and [Jobs](process/phases.md).

## Pipeline structure

Pipelines are made of one or more jobs and may include resources and
variables. Jobs are made of one or more steps plus some job-specific data.
Steps can be tasks, scripts, or references to external templates.
This is reflected in the structure of the YAML file.

- Pipeline
  - Job 1
    - Step 1.1
    - Step 1.2
    - ...
  - Job 2
    - Step 2.1
    - Step 2.2
    - ...
  - ...

For simpler pipelines, not all of these levels are required. For example,
in a single-job build, you can omit the container for "jobs" since there
are only steps. Also, many options shown here are optional and have good
defaults, so your YAML definitions are unlikely to include all of them.


### Conventions

Conventions used in this topic:
* To the left of `:` are literal keywords used in pipeline definitions.
* To the right of `:` are data types. These can be primitives like **string** or references to rich structures defined elsewhere in this topic.
* `[` *datatype* `]` indicates an array of the mentioned data type. For instance, `[ string ]` is an array of strings.
* `{` *datatype* `:` *datatype* `}` indicates a mapping of one data type to another. For instance, `{ string: string }` is a mapping of strings to strings.
* `|` indicates there are multiple data types available for the keyword. For
instance, `job | templateReference` means either a job definition or a
template reference are allowed.

### YAML basics

This document covers the schema of an Azure Pipelines YAML file.
To learn the basics of YAML, see [Learn YAML in Y Minutes](https://learnxinyminutes.com/docs/yaml/).
Note: Azure Pipelines doesn't support all features of YAML, such as complex keys and sets.

## Pipeline

# [Schema](#tab/schema)

```yaml
name: string  # build numbering format
resources:
  containers: [ container ]
  repositories: [ repository ]
variables: { string: string } | variable
trigger: trigger
jobs: [ job | templateReference ]
```

# [Example](#tab/example)

```yaml
name: $(Date:yyyyMMdd).$(Rev:.r)
variables:
  var1: value1
```

---

Learn more about [multi-job pipelines](process/multiple-phases.md?tabs=yaml),
using [containers](#container) and [repositories](#repository) in pipelines,
[triggers](#trigger), [variables](process/variables.md?tabs=yaml), and
[build number formats](build/options.md#build-number-format).

### Container

[Container jobs](process/container-phases.md) let you isolate your tools and
dependencies inside a container. The agent will launch an instance of your
specified container, then run steps inside it. The `container` resource lets
you specify your container images.

# [Schema](#tab/schema)

```yaml
resources:
  containers:
  - container: string  # identifier (no spaces allowed)
    image: string  # container image name
    options: string  # arguments to pass to container at startup
    endpoint: string  # endpoint for a private container registry
    env: { string: string }  # list of environment variables to add
```

# [Example](#tab/example)

```yaml
resources:
  containers:
  - container: linux
    image: ubuntu-16.04
```

---

### Repository

If your pipeline has [templates](#job-templates) in another repository, you must
let the system know about that repository. The `repository` resource lets you
specify an external repository.

# [Schema](#tab/schema)

```yaml
resources:
  repositories:
  - repository: string  # identifier (no spaces allowed)
    type: enum  # see below
    name: string  # repository name (format depends on `type`)
    ref: string  # ref name to use, defaults to 'refs/heads/master'
    endpoint: string  # name of the service connection to use (for non-Azure Repos types)
```

# [Example](#tab/example)
```yaml

resources:
  repositories:
  - repository: common
    type: github
    name: Contoso/CommonTools
```

---

#### Type

Pipelines support two types of repositories, `git` and `github`. `git` refers to
Azure Repos Git repos. If you choose `git` as your type, then `name` refers to another
repository in the same project. For example, `otherRepo`. To refer to a repo in
another project within the same organization, prefix the name with that project's name.
For example, `OtherProject/otherRepo`.

If you choose `github` as your type, then `name` is the full name of the GitHub
repo including the user or organization. For example, `Microsoft/vscode`. Also,
GitHub repos require a [service connection](library/service-endpoints.md)
for authorization.

## Trigger

A trigger specifies what branches will cause a continuous integration build to
run. If left unspecified, pushes to every branch will trigger a build.
Learn more about [triggers](build/triggers.md?tabs=yaml#continuous-integration-ci)
and how to specify them.

# [Schema](#tab/schema)

List syntax:

```yaml
trigger: [ string ] # list of branch names
```

Disable syntax:

```yaml
trigger: none # will disable CI builds entirely
```

Full syntax:

```yaml
trigger:
  batch: boolean # batch changes if true, start a new build for every push if false
  branches:
    include: [ string ] # branch names which will trigger a build
    exclude: [ string ] # branch names which will not
  paths:
    include: [ string ] # file paths which must match to trigger a build
    exclude: [ string ] # file paths which will not trigger a build
```

Note that `paths` is only valid for Azure Repos, not any other Git provider.

# [Example](#tab/example)

List syntax:

```yaml
trigger:
- master
- develop
```

Disable syntax:

```yaml
trigger: none # will disable CI builds entirely
```

Full syntax:

```yaml
trigger:
  batch: true
  branches:
    include:
    - features/*
    exclude:
    - features/experimental/*
  paths:
    exclude:
    - README.md
```

---

## Job

A [job](process/phases.md?tabs=yaml) is a collection of steps to be run by an
[agent](agents/agents.md) or, in some cases, on the server. Jobs can be
run [conditionally](process/multiple-phases.md?tabs=yaml#conditions), and they
may [depend on earlier jobs](process/multiple-phases.md?tabs=yaml#dependencies).

# [Schema](#tab/schema)

```yaml
- job: string  # name of the job, no spaces allowed
  displayName: string  # friendly name to display in the UI
  dependsOn: string | [ string ]
  condition: string
  strategy:
    matrix: # matrix strategy, see below
    parallel: # parallel strategy, see below
    maxParallel: number # maximum number of agents to simultaneously run copies of this job on
  continueOnError: boolean  # 'true' if future jobs should run even if this job fails; defaults to 'false'
  pool: pool # see pool schema
  workspace:
    clean: outputs | resources | all # what to clean up after the job runs
  container: string # container resource to run this job inside
  timeoutInMinutes: number # how long to run the job before automatically cancelling
  cancelTimeoutInMinutes: number # how much time to give run always even if cancelled tasks before killing them
  variables: { string: string } | [ variable ]
  steps: [ script | bash | powershell | checkout | task | stepTemplate ]
```

# [Example](#tab/example)

```yaml
- job: MyJob
  displayName: My First Job
  continueOnError: true
  workspace:
    clean: outputs
  steps:
  - script: echo My first job
```

---

Learn more about [variables](process/variables.md?tabs=yaml). Also see
the schema references for [pool](#pool), [server](#server), [script](#script),
[bash](#bash), [powershell](#powershell), [checkout](#checkout), [task](#task),
and [step templates](#step-template).

> [!Note]
> If you have only one job, you can use [single-job syntax](process/phases.md?tabs=yaml)
> which omits many of the keywords here.

### Strategies

`matrix` and `parallel` are mutually-exclusive strategies for duplicating a job.

#### Matrix

Matrixing generates copies of a job with different inputs. This is useful for
testing against different configurations or platform versions.

# [Schema](#tab/schema)

```yaml
strategy:
  matrix: { string1: { string2: string3 } }
```

For each `string1` in the matrix, a copy of the job will be generated. `string1`
will be appended to the name of the job. For each `string2`, a variable called
`string2` with the value `string3` will be available to the job.

# [Example](#tab/example)

```yaml
job: Build
strategy:
  matrix:
    Python35:
      PYTHON_VERSION: '3.5'
    Python36:
      PYTHON_VERSION: '3.6'
```

This matrix will create two jobs, "Build Python35" and "Build Python36". Within
each job, a variable PYTHON_VERSION will be available. In "Build Python35", it
will be set to "3.5". Likewise, it will be "3.6" in "Build Python36".

---

#### Parallel

This specifies how many duplicates of the job should run. This is useful for
slicing up a large test matrix. The [VS Test task](tasks/test/vstest.md)
understands how to divide the test load across the number of jobs scheduled.

# [Schema](#tab/schema)

```yaml
strategy:
  parallel: number
```

# [Example](#tab/example)

```yaml
strategy:
  parallel: 4
```

---


#### Maximum Parallelism

Regardless of which strategy is chosen and how many jobs are generated, this
value specifies the maximum number of agents which will run at a time for
this family of jobs. It defaults to unlimited if not specified.

# [Schema](#tab/schema)

```yaml
strategy:
  maxParallel: number
```

# [Example](#tab/example)

```yaml
strategy:
  maxParallel: 2
  matrix:
    Python35:
      PYTHON_VERSION: '3.5'
    Python36:
      PYTHON_VERSION: '3.6'
    Python37:
      PYTHON_VERSION: '3.7'
```

This example will generate 3 jobs but only run 2 at a time.

---


## Job templates

Jobs can also be specified in a job template. Job templates are separate
files which you can reference in the main pipeline definition.

# [Schema](#tab/schema)

In the main pipeline:

```yaml
- template: string # name of template to include
  parameters: { string: any } # provided parameters
```

And in the included template:

```yaml
parameters: { string: any } # expected parameters
jobs: [ job ]
```

# [Example](#tab/example)

In this example, a single job is repeated on three platforms.
The job itself is only specified once.

```yaml
# File: jobs/build.yml

parameters:
  name: ''
  pool: ''
  sign: false

jobs:
- job: ${{ parameters.name }}
  pool: ${{ parameters.pool }}
  steps:
  - script: npm install
  - script: npm test
  - ${{ if eq(parameters.sign, 'true') }}:
    - script: sign
```

```yaml
# File: azure-pipelines.yml

jobs:
- template: jobs/build.yml  # Template reference
  parameters:
    name: macOS
    pool:
      vmImage: 'macOS-10.13'

- template: jobs/build.yml  # Template reference
  parameters:
    name: Linux
    pool:
      vmImage: 'ubuntu-16.04'

- template: jobs/build.yml  # Template reference
  parameters:
    name: Windows
    pool:
      vmImage: 'vs2017-win2016'
    sign: true  # Extra step on Windows only
```

---

See [templates](process/templates.md) for more about working with templates.

## Pool

`pool` specifies which [pool](agents/pools-queues.md) to use for a job of the
pipeline. It also holds information about the job's strategy for running.

# [Schema](#tab/schema)

Full syntax:

```yaml
pool:
  name: string  # name of the pool to run this job in
  demands: string | [ string ]  ## see below
  vmImage: string # name of the vm image you want to use, only valid in the Microsoft-hosted pool
```

If you're using a Microsoft-hosted pool, then choose an
[available `vmImage`](agents/hosted.md#use-a-microsoft-hosted-agent).

If you're using a private pool and don't need to specify demands, this can
be shortened to:

```yaml
pool: string # name of the private pool to run this job in
```

# [Example](#tab/example)

To use the Microsoft hosted pool, omit the name and specify one of the available
[hosted images](agents/hosted.md#use-a-microsoft-hosted-agent).

```yaml
pool:
  vmImage: ubuntu-16.04
```

To use a private pool with no demands:

```yaml
pool: MyPool
```

---

Learn more about [conditions](process/conditions.md?tabs=yaml) and
[timeouts](process/phases.md?tabs=yaml#timeouts).

### Demands

`demands` is supported by private pools. You can check for existence of a capability or a specific string like this:

# [Schema](#tab/schema)

```yaml
pool:
  demands: [ string ]
```

# [Example](#tab/example)

```yaml
pool:
  name: MyPool
  demands:
  - myCustomCapability   # check for existence of capability
  - agent.os -equals Darwin  # check for specific string in capability
```

---

## Server

`server` specifies a [server job](process/server-phases.md).

# [Schema](#tab/schema)

This will make the job run as a server job rather than an agent job.

```yaml
pool: server
```

# [Example](#tab/example)

```yaml
pool: server
```

---

## Script

`script` is a shortcut for the [command line task](tasks/utility/command-line.md).
It will run a script using cmd.exe on Windows and Bash on other platforms.

# [Schema](#tab/schema)

```yaml
- script: string  # contents of the script to run
  displayName: string  # friendly name displayed in the UI
  name: string  # identifier for this step (no spaces allowed)
  workingDirectory: string  # initial working directory for the step
  failOnStderr: boolean  # if the script writes to stderr, should that be treated as the step failing?
  condition: string
  continueOnError: boolean  # 'true' if future steps should run even if this step fails; defaults to 'false'
  enabled: boolean  # whether or not to run this step; defaults to 'true'
  timeoutInMinutes: number
  env: { string: string }  # list of environment variables to add
```

# [Example](#tab/example)

```yaml
- powershell: |
    Write-Host "Hello $env:name"
  displayName: A multiline PowerShell script
  env:
    name: Microsoft
```

---

Learn more about [conditions](process/conditions.md?tabs=yaml) and
[timeouts](process/phases.md?tabs=yaml#timeouts).

## Bash

`bash` is a shortcut for the [shell script task](tasks/utility/shell-script.md).
It will run a script in Bash on Windows, macOS, or Linux.

# [Schema](#tab/schema)

```yaml
- bash: string  # contents of the script to run
  displayName: string  # friendly name displayed in the UI
  name: string  # identifier for this step (no spaces allowed)
  workingDirectory: string  # initial working directory for the step
  failOnStderr: boolean  # if the script writes to stderr, should that be treated as the step failing?
  condition: string
  continueOnError: boolean  # 'true' if future steps should run even if this step fails; defaults to 'false'
  enabled: boolean  # whether or not to run this step; defaults to 'true'
  timeoutInMinutes: number
  env: { string: string }  # list of environment variables to add
```

# [Example](#tab/example)

```yaml
- bash: |
    which bash
    echo Hello $name
  displayName: Multiline Bash script
  env:
    name: Microsoft
```

---

Learn more about [conditions](process/conditions.md?tabs=yaml) and
[timeouts](process/phases.md?tabs=yaml#timeouts).

## PowerShell

`powershell` is a shortcut for the [PowerShell task](tasks/utility/powershell.md).
It will run a script in PowerShell on Windows.

# [Schema](#tab/schema)

```yaml
- powershell: string  # contents of the script to run
  displayName: string  # friendly name displayed in the UI
  name: string  # identifier for this step (no spaces allowed)
  errorActionPreference: enum  # see below
  ignoreLASTEXITCODE: boolean  # see below
  failOnStderr: boolean  # if the script writes to stderr, should that be treated as the step failing?
  workingDirectory: string  # initial working directory for the step
  condition: string
  continueOnError: boolean  # 'true' if future steps should run even if this step fails; defaults to 'false'
  enabled: boolean  # whether or not to run this step; defaults to 'true'
  timeoutInMinutes: number
  env: { string: string }  # list of environment variables to add
```

# [Example](#tab/example)

```yaml
- script: echo Hello $(name)
  displayName: Say hello
  name: firstStep
  workingDirectory: $(Build.SourcesDirectory)
  failOnStderr: true
  env:
    name: Microsoft
```

---

Learn more about [conditions](process/conditions.md?tabs=yaml) and
[timeouts](process/phases.md?tabs=yaml#timeouts).

### Error action preference
Unless specified, the task defaults the error action preference to `stop`. The
line `$ErrorActionPreference = 'stop'` is prepended to the top of your script.

When the error action preference is set to stop, errors will cause PowerShell
to terminate and return a non-zero exit code. The task will also be marked as
Failed.

# [Schema](#tab/schema)

```yaml
errorActionPreference: stop | continue | silentlyContinue
```

# [Example](#tab/example)

```yaml
steps:
- powershell: |
    Write-Error 'Uh oh, an error occurred'
    Write-Host 'Trying again...'
  displayName: Error action preference
  errorActionPreference: continue
```

---

### Ignore last exit code

By default, the last exit code returned from your script will be checked and,
if non-zero, treated as a step failure. The system will prepend your script with:

`if ((Test-Path -LiteralPath variable:\LASTEXITCODE)) { exit $LASTEXITCODE }`

If you don't want this behavior, set `ignoreLASTEXITCODE` to `true`.

# [Schema](#tab/schema)

```yaml
ignoreLASTEXITCODE: boolean
```

# [Example](#tab/example)

```yaml
steps:
- powershell: git nosuchcommand
  displayName: Ignore last exit code
  ignoreLASTEXITCODE: true
```

---

## Checkout

`checkout` informs the system how to handle checking out source code.

# [Schema](#tab/schema)

```yaml
- checkout: self  # self represents the repo where the initial Pipelines YAML file was found
  clean: boolean  # whether to fetch clean each time
  fetchDepth: number  # the depth of commits to ask Git to fetch
  lfs: boolean  # whether to download Git-LFS files
  submodules: true | recursive  # set to 'true' for a single level of submodules or 'recursive' to get submodules of submodules
  persistCredentials: boolean  # set to 'true' to leave the OAuth token in the Git config after the initial fetch
```

Or to avoid syncing sources at all:

```yaml
- checkout: none
```

# [Example](#tab/example)

```yaml
- checkout: self  # self represents the repo where the initial Pipelines YAML file was found
  clean: false
  fetchDepth: 5
  lfs: true
```

---

## Task

[Tasks](process/tasks.md) are the building blocks of a pipeline. There is a
[catalog of tasks](tasks/index.md) available to choose from.

# [Schema](#tab/schema)

```yaml
- task: string  # reference to a task and version, e.g. "VSBuild@1"
  displayName: string  # friendly name displayed in the UI
  name: string  # identifier for this step (no spaces allowed)
  condition: string
  continueOnError: boolean  # 'true' if future steps should run even if this step fails; defaults to 'false'
  enabled: boolean  # whether or not to run this step; defaults to 'true'
  timeoutInMinutes: number
  inputs: { string: string }  # task-specific inputs
  env: { string: string }  # list of environment variables to add
```

# [Example](#tab/example)

```yaml
- task: VSBuild@1
  displayName: Build
  timeoutInMinutes: 120
  inputs:
    solution: '**\*.sln'
```

---

## Step template

A set of steps can be defined in one file and used multiple places in another file.

# [Schema](#tab/schema)

In the main pipeline:

```yaml
steps:
- template: string  # reference to template
  parameters: { string: any } # provided parameters
```

And in the included template:

```yaml
parameters: { string: any } # expected parameters
steps: [ script | bash | powershell | checkout | task ]
```

# [Example](#tab/example)

```yaml
# File: steps/build.yml

steps:
- script: npm install
- script: npm test
```

```yaml
# File: azure-pipelines.yml

jobs:
- job: macOS
  pool:
    vmImage: 'macOS-10.13'
  steps:
  - template: steps/build.yml # Template reference

- job: Linux
  pool:
    vmImage: 'ubuntu-16.04'
  steps:
  - template: steps/build.yml # Template reference

- job: Windows
  pool:
    vmImage: 'vs2017-win2016'
  steps:
  - template: steps/build.yml # Template reference
  - script: sign              # Extra step on Windows only
```

---

See [templates](process/templates.md) for more about working with templates.

<!--
## Syntax highlighting

Syntax highlighting is available for the pipeline schema via a VS Code
extension. You can [download VS Code](https://code.visualstudio.com),
[install the extension](https://example.com/TODO), and
[check out the project on GitHub](https://github.com/Microsoft/pipelines-vscode).
-->
