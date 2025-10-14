import { Injectable } from '@nestjs/common';
import { CreateGitlabDto } from './dto/create-gitlab.dto';
import { UpdateGitlabDto } from './dto/update-gitlab.dto';

@Injectable()
export class GitlabService {
  private readonly gitlabUrl = process.env.GITLAB_URL;
  private readonly token = process.env.GITLAB_TOKEN;

  async createProject(createGitlabDto: CreateGitlabDto) {
    const response = await fetch(`${this.gitlabUrl}/projects`, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': this.token!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: createGitlabDto.name,
        description: createGitlabDto.description,
        visibility: createGitlabDto.visibility,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    return response.json();
  }

  findAll() {
    return `This action returns all gitlab`;
  }

  async findOne(name: string) {
    const response = await fetch(`${this.gitlabUrl}/projects?search=${name}`, {
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': this.token!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    return response.json();
  }

  update(id: number, updateGitlabDto: UpdateGitlabDto) {
    return `This action updates a #${id} gitlab`;
  }

  async remove(id: number) {
    return await fetch(`${this.gitlabUrl}/projects/${id}`, {
      method: 'DELETE',
      headers: { 'PRIVATE-TOKEN': this.token! },
    });
  }
}
